import asyncio
import hashlib
import html
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Literal, Optional
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from og_image import render_og  # noqa: E402
from otp_providers import get_otp_provider  # noqa: E402
from seed import DEMO_CARDS  # noqa: E402

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
BRAND_NAME = os.environ["BRAND_NAME"]

app = FastAPI()
api = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("invites")

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_DAYS = 7
EVENT_TYPES = {"wedding", "birthday"}
TEMPLATES = {"wedding-royal", "birthday-playful"}
MUSIC = {"none", "royal-raag", "party-pop", "music-box"}
EYEBROWS = {"wedding": "You are invited to the wedding of", "birthday": "You're invited to celebrate"}


def now():
    return datetime.now(timezone.utc)


# ---------- Models ----------
class EventItem(BaseModel):
    event_id: Optional[str] = None
    name: str = Field(min_length=1, max_length=60)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(default="", pattern=r"^(\d{2}:\d{2})?$")
    venue_name: str = Field(default="", max_length=120)
    venue_address: str = Field(default="", max_length=300)
    map_link: str = Field(default="", max_length=500)
    dress_code: str = Field(default="", max_length=120)
    custom_text: str = Field(default="", max_length=1000)


class CardIn(BaseModel):
    event_type: str
    template: str
    language: Literal["en"] = "en"
    primary_name: str = Field(min_length=1, max_length=60)
    secondary_name: str = Field(default="", max_length=60)
    host_family: str = Field(default="", max_length=120)
    title: str = Field(default="", max_length=120)
    invitation_text: str = Field(default="", max_length=1500)
    blessing_key: str = Field(default="neutral", max_length=20)
    blessing_text: str = Field(default="", max_length=1000)
    music_track: str = "none"
    host_whatsapp: str = Field(default="", max_length=20)
    timezone: str = Field(default="+05:30", pattern=r"^[+-]\d{2}:\d{2}$")
    status: Literal["draft", "published"] = "draft"
    events: List[EventItem] = Field(min_length=1, max_length=10)

    @field_validator("event_type")
    @classmethod
    def _type(cls, v):
        if v not in EVENT_TYPES:
            raise ValueError("Unsupported event type")
        return v

    @field_validator("template")
    @classmethod
    def _tpl(cls, v):
        if v not in TEMPLATES:
            raise ValueError("Unknown template")
        return v

    @field_validator("music_track")
    @classmethod
    def _music(cls, v):
        if v not in MUSIC:
            raise ValueError("Unknown music track")
        return v


class RsvpIn(BaseModel):
    guest_name: str = Field(min_length=1, max_length=80)
    status: Literal["yes", "no", "maybe"]
    guests: int = Field(default=1, ge=0, le=20)
    message: str = Field(default="", max_length=500)


class GoogleSessionIn(BaseModel):
    session_id: str


class OtpRequestIn(BaseModel):
    phone: str


class OtpVerifyIn(BaseModel):
    phone: str
    code: str = Field(min_length=4, max_length=8)
    name: str = Field(default="", max_length=60)


# ---------- Helpers ----------
def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:40].strip("-") or "card"


async def unique_slug(base):
    slug, i = base, 2
    while await db.cards.find_one({"slug": slug}, {"_id": 1}):
        slug = f"{base}-{i}"
        i += 1
    return slug


def assign_event_ids(events):
    valid = [e.event_id for e in events if e.event_id and re.fullmatch(r"e\d+", e.event_id)]
    n = max([int(i[1:]) for i in valid] or [0])
    out, seen = [], set()
    for e in events:
        eid = e.event_id if e.event_id in valid and e.event_id not in seen else None
        if not eid:
            n += 1
            eid = f"e{n}"
        seen.add(eid)
        out.append({**e.model_dump(), "event_id": eid})
    return out


def names_line(card):
    if card["event_type"] == "wedding" and card.get("secondary_name"):
        return f"{card['primary_name']} & {card['secondary_name']}"
    return card["primary_name"]


def event_utc(ev, tz):
    sign = 1 if tz[0] == "+" else -1
    off = sign * timedelta(hours=int(tz[1:3]), minutes=int(tz[4:6]))
    start = datetime.strptime(f"{ev['date']} {ev['time']}", "%Y-%m-%d %H:%M") - off
    if ev.get("end_time"):
        end = datetime.strptime(f"{ev['date']} {ev['end_time']}", "%Y-%m-%d %H:%M") - off
        if end <= start:
            end += timedelta(days=1)
    else:
        end = start + timedelta(hours=3)
    return start, end


def display_date(ev):
    d = datetime.strptime(f"{ev['date']} {ev['time']}", "%Y-%m-%d %H:%M")
    return d.strftime("%a, %d %b %Y"), d.strftime("%I:%M %p").lstrip("0")


def public_base(request: Request):
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    return f"{proto}://{host}"


def find_event(card, eid):
    return next((e for e in card["events"] if e["event_id"] == eid), card["events"][0])


# ---------- Auth ----------
async def create_session(user_id, response: Response, token=None):
    token = token or uuid.uuid4().hex + uuid.uuid4().hex
    await db.user_sessions.insert_one({
        "session_token": token, "user_id": user_id,
        "expires_at": now() + timedelta(days=SESSION_DAYS), "created_at": now(),
    })
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none",
                        path="/", max_age=SESSION_DAYS * 86400)
    return token


async def current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(401, "Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Invalid session")
    exp = session["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now():
        raise HTTPException(401, "Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


@api.post("/auth/google/session")
async def google_session(body: GoogleSessionIn, response: Response):
    r = await asyncio.to_thread(requests.get, EMERGENT_SESSION_URL,
                                headers={"X-Session-ID": body.session_id}, timeout=15)
    if r.status_code != 200:
        raise HTTPException(401, "Google sign-in failed")
    data = r.json()
    user = await db.users.find_one({"email": data["email"], "auth_provider": "google"}, {"_id": 0})
    if user:
        await db.users.update_one({"user_id": user["user_id"]},
                                  {"$set": {"name": data.get("name", ""), "picture": data.get("picture", "")}})
    else:
        user = {"user_id": f"user_{uuid.uuid4().hex[:12]}", "auth_provider": "google", "email": data["email"],
                "phone": None, "name": data.get("name", ""), "picture": data.get("picture", ""),
                "created_at": now().isoformat()}
        await db.users.insert_one(dict(user))
    await create_session(user["user_id"], response, data["session_token"])
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})


def normalize_phone(raw):
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        digits = "91" + digits
    if not 11 <= len(digits) <= 15:
        raise HTTPException(422, "Enter a valid phone number")
    return "+" + digits


def code_hash(phone, code):
    return hashlib.sha256(f"{phone}:{code}".encode()).hexdigest()


@api.post("/auth/otp/request")
async def otp_request(body: OtpRequestIn):
    phone = normalize_phone(body.phone)
    provider = get_otp_provider()
    code = provider.generate_code()
    await db.otp_codes.replace_one({"phone": phone}, {
        "phone": phone, "code_hash": code_hash(phone, code),
        "expires_at": now() + timedelta(minutes=10), "attempts": 0,
    }, upsert=True)
    await provider.send(phone, code)
    resp = {"sent": True, "phone": phone, "channel": provider.channel, "mocked": provider.is_mock}
    if provider.is_mock:
        resp["dev_code"] = code
    return resp


@api.post("/auth/otp/verify")
async def otp_verify(body: OtpVerifyIn, response: Response):
    phone = normalize_phone(body.phone)
    rec = await db.otp_codes.find_one({"phone": phone}, {"_id": 0})
    exp = rec["expires_at"].replace(tzinfo=timezone.utc) if rec and rec["expires_at"].tzinfo is None else (rec or {}).get("expires_at")
    if not rec or exp < now():
        raise HTTPException(400, "Code expired. Please request a new one.")
    if rec["attempts"] >= 5:
        raise HTTPException(429, "Too many attempts. Please request a new code.")
    if rec["code_hash"] != code_hash(phone, body.code.strip()):
        await db.otp_codes.update_one({"phone": phone}, {"$inc": {"attempts": 1}})
        raise HTTPException(400, "Incorrect code")
    await db.otp_codes.delete_one({"phone": phone})
    user = await db.users.find_one({"phone": phone, "auth_provider": "phone"}, {"_id": 0})
    if not user:
        user = {"user_id": f"user_{uuid.uuid4().hex[:12]}", "auth_provider": "phone", "email": None,
                "phone": phone, "name": body.name.strip() or "Host", "picture": "",
                "created_at": now().isoformat()}
        await db.users.insert_one(dict(user))
    await create_session(user["user_id"], response)
    return user


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}


# ---------- Host cards ----------
async def owned_card(card_id, user):
    card = await db.cards.find_one({"card_id": card_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not card:
        raise HTTPException(404, "Card not found")
    return card


@api.get("/cards")
async def list_cards(user: dict = Depends(current_user)):
    cards = await db.cards.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    counts = {}
    pipeline = [
        {"$match": {"card_id": {"$in": [c["card_id"] for c in cards]}}},
        {"$group": {"_id": "$card_id", "responses": {"$sum": 1},
                    "attending": {"$sum": {"$cond": [{"$eq": ["$status", "yes"]}, "$guests", 0]}}}},
    ]
    async for row in db.rsvps.aggregate(pipeline):
        counts[row["_id"]] = {"responses": row["responses"], "attending": row["attending"]}
    for c in cards:
        c["rsvp"] = counts.get(c["card_id"], {"responses": 0, "attending": 0})
    return cards


@api.post("/cards")
async def create_card(body: CardIn, user: dict = Depends(current_user)):
    ts = now().isoformat()
    base = slugify("-".join(filter(None, [body.primary_name, body.secondary_name if body.event_type == "wedding" else ""])))
    doc = {**body.model_dump(), "events": assign_event_ids(body.events),
           "card_id": f"card_{uuid.uuid4().hex[:12]}", "slug": await unique_slug(base),
           "owner_id": user["user_id"], "created_at": ts, "updated_at": ts}
    await db.cards.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/cards/{card_id}")
async def get_card(card_id: str, user: dict = Depends(current_user)):
    return await owned_card(card_id, user)


@api.put("/cards/{card_id}")
async def update_card(card_id: str, body: CardIn, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    update = {**body.model_dump(), "events": assign_event_ids(body.events), "updated_at": now().isoformat()}
    await db.cards.update_one({"card_id": card_id}, {"$set": update})
    return await owned_card(card_id, user)


@api.delete("/cards/{card_id}")
async def delete_card(card_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    await db.cards.delete_one({"card_id": card_id})
    await db.rsvps.delete_many({"card_id": card_id})
    return {"ok": True}


@api.get("/cards/{card_id}/rsvps")
async def card_rsvps(card_id: str, user: dict = Depends(current_user)):
    card = await owned_card(card_id, user)
    rsvps = await db.rsvps.find({"card_id": card_id}, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    summary = []
    for ev in card["events"]:
        rows = [r for r in rsvps if r["event_id"] == ev["event_id"]]
        summary.append({
            "event_id": ev["event_id"], "name": ev["name"],
            "yes": sum(r["status"] == "yes" for r in rows),
            "maybe": sum(r["status"] == "maybe" for r in rows),
            "no": sum(r["status"] == "no" for r in rows),
            "attending": sum(r["guests"] for r in rows if r["status"] == "yes"),
        })
    return {"events": summary, "responses": rsvps[:50]}


# ---------- Public (guests) ----------
async def public_card(slug):
    card = await db.cards.find_one({"slug": slug, "status": "published"}, {"_id": 0, "owner_id": 0})
    if not card:
        raise HTTPException(404, "Invitation not found")
    return card


@api.get("/public/cards/{slug}")
async def get_public_card(slug: str):
    return await public_card(slug)


@api.post("/public/cards/{slug}/events/{event_id}/rsvp")
async def submit_rsvp(slug: str, event_id: str, body: RsvpIn):
    card = await public_card(slug)
    if not any(e["event_id"] == event_id for e in card["events"]):
        raise HTTPException(404, "Event not found")
    name = re.sub(r"\s+", " ", body.guest_name.strip())
    if not name:
        raise HTTPException(422, "Name is required")
    guests = 0 if body.status == "no" else max(1, body.guests)
    key = {"card_id": card["card_id"], "event_id": event_id, "guest_key": name.lower()}
    ts = now().isoformat()
    await db.rsvps.update_one(key, {
        "$set": {"guest_name": name, "status": body.status, "guests": guests,
                 "message": body.message.strip(), "updated_at": ts},
        "$setOnInsert": {"rsvp_id": f"rsvp_{uuid.uuid4().hex[:12]}", "created_at": ts},
    }, upsert=True)
    return await db.rsvps.find_one(key, {"_id": 0})


def ics_escape(s):
    return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


@api.get("/public/cards/{slug}/events/{event_id}/ics")
async def event_ics(slug: str, event_id: str):
    card = await public_card(slug)
    ev = find_event(card, event_id)
    start, end = event_utc(ev, card["timezone"])
    fmt = "%Y%m%dT%H%M%SZ"
    location = ", ".join(filter(None, [ev["venue_name"], ev["venue_address"]]))
    body = "\r\n".join([
        "BEGIN:VCALENDAR", "VERSION:2.0", f"PRODID:-//{BRAND_NAME}//Invitations//EN", "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT", f"UID:{card['card_id']}-{ev['event_id']}@invites",
        f"DTSTAMP:{now().strftime(fmt)}", f"DTSTART:{start.strftime(fmt)}", f"DTEND:{end.strftime(fmt)}",
        f"SUMMARY:{ics_escape(ev['name'] + ' - ' + names_line(card))}",
        f"DESCRIPTION:{ics_escape(card.get('title', ''))}", f"LOCATION:{ics_escape(location)}",
        "END:VEVENT", "END:VCALENDAR", "",
    ])
    return Response(body, media_type="text/calendar; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{slug}-{ev["event_id"]}.ics"'})


@api.get("/og/{slug}/{event_id}.png")
async def og_image(slug: str, event_id: str):
    card = await public_card(slug)
    ev = find_event(card, event_id)
    date_s, time_s = display_date(ev)
    png = await asyncio.to_thread(
        render_og, card["template"], EYEBROWS.get(card["event_type"], "You're invited"), names_line(card),
        ev["name"], f"{date_s}  ·  {time_s}", ", ".join(filter(None, [ev["venue_name"], ev["venue_address"]]))[:80],
        BRAND_NAME,
    )
    return Response(png, media_type="image/png", headers={"Cache-Control": "public, max-age=300"})


@api.get("/s/{slug}/{event_id}", response_class=HTMLResponse)
async def share_page(slug: str, event_id: str, request: Request, to: str = ""):
    card = await public_card(slug)
    ev = find_event(card, event_id)
    base = public_base(request)
    to = to.strip()[:80]
    target = f"{base}/i/{slug}/{ev['event_id']}" + (f"?{urlencode({'to': to})}" if to else "")
    date_s, time_s = display_date(ev)
    title = f"{names_line(card)} · {ev['name']}"
    if to:
        title = f"{to}, you're invited! {title}"
    desc = f"{date_s} at {time_s}" + (f" · {ev['venue_name']}" if ev["venue_name"] else "")
    version = hashlib.md5(card["updated_at"].encode()).hexdigest()[:8]
    image = f"{base}/api/og/{slug}/{ev['event_id']}.png?v={version}"
    e = html.escape
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{e(BRAND_NAME)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{e(image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="{e(target)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url={e(target)}">
</head><body style="background:#0F0B15;color:#F7F5FA;font-family:sans-serif">
<p><a href="{e(target)}" style="color:#E6B756">Open your invitation</a></p>
<script>location.replace({target!r});</script></body></html>"""
    return HTMLResponse(page)


@api.get("/")
async def root():
    return {"ok": True, "brand": BRAND_NAME}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.cards.create_index("slug", unique=True)
    await db.cards.create_index("card_id", unique=True)
    await db.cards.create_index("owner_id")
    await db.rsvps.create_index([("card_id", 1), ("event_id", 1), ("guest_key", 1)], unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    for card in DEMO_CARDS:
        await db.cards.replace_one({"slug": card["slug"]}, card, upsert=True)
    logger.info("Demo cards seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
