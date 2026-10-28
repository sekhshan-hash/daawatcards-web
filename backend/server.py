import asyncio
import hashlib
import html
import io
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from og_image import event_scheme, render_og  # noqa: E402
from site_api import build_site_router  # noqa: E402
from seed import DEMO_CARDS  # noqa: E402
from storage import STORAGE_PREFIX, get_object, init_storage, put_object  # noqa: E402

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
BRAND_NAME = os.environ["BRAND_NAME"]

app = FastAPI()
api = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("invites")

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_DAYS = 400
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].lower()
EVENT_TYPES = {"wedding", "birthday", "engagement", "aqiqah", "babyShower", "housewarming", "corporate"}
TEMPLATES = {"wedding-royal", "birthday-playful", "modern-minimal", "rose-gold", "little-star", "warm-hearth", "boardroom"}
MUSIC = {"none", "royal-raag", "party-pop", "music-box", "lullaby"}
COUPLE_TYPES = {"wedding", "engagement"}
EYEBROWS = {
    "en": {"wedding": "You are invited to the wedding of", "birthday": "You're invited to celebrate",
           "engagement": "You are invited to the engagement of", "aqiqah": "You are invited to welcome",
           "babyShower": "You are invited to a baby shower for", "housewarming": "You are invited to the housewarming of",
           "corporate": "You are cordially invited by"},
    "hi": {"wedding": "आप विवाह समारोह में आमंत्रित हैं", "birthday": "जन्मदिन के जश्न में आपका स्वागत है",
           "engagement": "आप सगाई समारोह में आमंत्रित हैं", "aqiqah": "नन्हे मेहमान के स्वागत में आमंत्रण",
           "babyShower": "गोद भराई में आपका स्वागत है", "housewarming": "गृह प्रवेश में आप आमंत्रित हैं",
           "corporate": "आप सादर आमंत्रित हैं"},
    "ur": {"wedding": "آپ شادی کی تقریب میں مدعو ہیں", "birthday": "سالگرہ کے جشن میں آپ مدعو ہیں",
           "engagement": "آپ منگنی کی تقریب میں مدعو ہیں", "aqiqah": "ننھے مہمان کے استقبال میں مدعو ہیں",
           "babyShower": "گود بھرائی کی تقریب میں مدعو ہیں", "housewarming": "نئے گھر کی خوشی میں مدعو ہیں",
           "corporate": "آپ کو مدعو کیا جاتا ہے"},
}
INVITED = {"en": "{to}, you're invited!", "hi": "{to}, आप आमंत्रित हैं!", "ur": "{to}، آپ مدعو ہیں!"}
TYPE_TITLES = {"wedding": "Wedding", "engagement": "Engagement", "birthday": "Birthday", "aqiqah": "Aqiqah Ceremony",
               "babyShower": "Baby Shower", "housewarming": "Housewarming", "corporate": "Event"}


def intro_title(card):
    """Invitation title on the intro screen; mirrors frontend autoIntroTitle (traditions.js)."""
    if card.get("intro_title", "").strip():
        return card["intro_title"].strip()
    evs = card.get("events", [])
    lang = card.get("language", "en")
    name = TYPE_TITLES.get(card.get("event_type"), "Event") if len(evs) != 1 else evs[0]["name"].strip()
    if len(evs) == 1 and name.lower() == "aqiqah":
        name = "Aqiqah Ceremony"
    if lang == "hi":
        return f"{name} निमंत्रण"
    if lang == "ur":
        return f"دعوتِ {name}"
    return name if "invitation" in name.lower() else f"{name} Invitation"
ALLOWED_IMG = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_UPLOAD = 8 * 1024 * 1024


def now():
    return datetime.now(timezone.utc)


# ---------- Models ----------
class CustomHeader(BaseModel):
    text: str = Field(default="", max_length=120)
    sub: str = Field(default="", max_length=160)
    script: Literal["latin", "deva", "arabic", "guru", "other"] = "latin"
    size: Literal["s", "m", "l"] = "m"
    color: Literal["gold", "white"] = "gold"


class PhotoFit(BaseModel):
    shape: Literal["full", "portrait", "square", "wide", "arch", "circle"] = "full"
    x: float = Field(default=50, ge=0, le=100)
    y: float = Field(default=40, ge=0, le=100)
    zoom: float = Field(default=1, ge=1, le=4)
    style: Literal["framed", "blended"] = "framed"


MEAL_LABELS = {"breakfast": "Breakfast", "brunch": "Brunch", "lunch": "Lunch", "hightea": "High Tea",
               "snacks": "Snacks / Refreshments", "supper": "Supper", "dinner": "Dinner", "hightea_dinner": "High Tea & Dinner"}
MEAL_I18N = {
    "hi": {"breakfast": "नाश्ते", "brunch": "ब्रंच", "lunch": "दोपहर के भोजन", "hightea": "हाई टी", "snacks": "जलपान",
           "supper": "रात्रि भोज", "dinner": "रात्रि भोज", "hightea_dinner": "हाई टी और रात्रि भोज"},
    "ur": {"breakfast": "ناشتہ", "brunch": "برنچ", "lunch": "ظہرانہ", "hightea": "ہائی ٹی", "snacks": "ریفریشمنٹ",
           "supper": "عشائیہ", "dinner": "عشائیہ", "hightea_dinner": "ہائی ٹی اور عشائیہ"},
}
MEAL_LINE = {"en": "{m} to follow", "hi": "{m} की व्यवस्था रहेगी", "ur": "{m} کا اہتمام ہوگا"}


def meal_name(ev, lang="en"):
    meal = ev.get("meal", "")
    if meal == "custom":
        return ev.get("meal_custom", "").strip()
    return MEAL_I18N.get(lang, MEAL_LABELS).get(meal, "")


def meal_line(ev, lang="en"):
    name = meal_name(ev, lang)
    return (ev.get("meal_line", "").strip() or MEAL_LINE.get(lang, MEAL_LINE["en"]).format(m=name)) if name else ""


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
    meal: Literal["", "none", "breakfast", "brunch", "lunch", "hightea", "snacks", "supper", "dinner", "hightea_dinner", "custom"] = ""
    meal_custom: str = Field(default="", max_length=60)
    meal_line: str = Field(default="", max_length=140)
    photo_fit: Optional[PhotoFit] = None
    custom_text: str = Field(default="", max_length=1000)
    photo: str = Field(default="", max_length=300)
    color: Literal["", "template", "emerald", "marigold", "magenta", "midnight", "crimson", "peacock", "coral", "lavender", "champagne", "blush"] = ""
    header_hidden: bool = False
    wording: Optional[str] = Field(default=None, max_length=1500)
    dua: Optional[str] = Field(default=None, max_length=600)
    closing: Optional[str] = Field(default=None, max_length=300)
    concluded: Optional[str] = Field(default=None, max_length=600)
    rsvp_line: str = Field(default="", max_length=200)
    header_key: str = Field(default="", max_length=30)
    custom_header: CustomHeader = Field(default_factory=CustomHeader)


class FamilyIn(BaseModel):
    groom_family: str = Field(default="", max_length=80)
    bride_family: str = Field(default="", max_length=80)
    groom_parents: str = Field(default="", max_length=120)
    bride_parents: str = Field(default="", max_length=120)
    groom_grandparents: str = Field(default="", max_length=160)
    bride_grandparents: str = Field(default="", max_length=160)
    host_side: Literal["groom", "bride"] = "groom"
    hidden: bool = False


class EffectsIn(BaseModel):
    fireworks: bool = True
    vibration: bool = True
    intensity: Literal["low", "medium", "high"] = "medium"


class CardIn(BaseModel):
    event_type: str
    template: str
    language: Literal["en", "hi", "ur"] = "en"
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
    agreed_terms: bool = False
    heading_font: Literal["default", "cinzel", "playfair", "greatvibes", "fredoka", "rozha"] = "default"
    events: List[EventItem] = Field(min_length=1, max_length=10)
    photos: List[str] = Field(default_factory=list, max_length=2)
    wishes_photo: str = Field(default="", max_length=300)
    tradition: Literal["muslim", "hindu", "sikh", "christian", "neutral"] = "neutral"
    header_key: str = Field(default="", max_length=30)
    family: FamilyIn = Field(default_factory=FamilyIn)
    custom_header: CustomHeader = Field(default_factory=CustomHeader)
    header_per_event: bool = False
    intro_title: str = Field(default="", max_length=80)
    photo_fit: Dict[Literal["hero", "feature", "wishes"], PhotoFit] = Field(default_factory=dict)
    photo_place: str = Field(default="", pattern=r"^(|cover|intro|wishes|event:[A-Za-z0-9_-]{1,20})$")
    hub_heading: str = Field(default="", max_length=80)
    welcome_text: str = Field(default="", max_length=400)
    timeline_art: bool = True
    effects: EffectsIn = Field(default_factory=EffectsIn)

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


class WishIn(BaseModel):
    guest_name: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=1000)
    event_id: str = Field(default="", max_length=10)
    guest_id: str = Field(default="", max_length=20)


class GuestIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(default="", max_length=25)
    event_ids: List[str] = Field(default_factory=list, max_length=10)


class GuestBulkIn(BaseModel):
    guests: List[GuestIn] = Field(min_length=1, max_length=1000)
    on_duplicate: Literal["skip", "merge"] = "skip"


class GuestIdsIn(BaseModel):
    guest_ids: List[str] = Field(min_length=1, max_length=2000)


class GuestRename(BaseModel):
    guest_id: str
    name: str = Field(min_length=1, max_length=80)


class GuestRenameIn(BaseModel):
    guests: List[GuestRename] = Field(min_length=1, max_length=2000)


class InviteTemplateIn(BaseModel):
    template: str = Field(default="", max_length=2000)


class OpenIn(BaseModel):
    guest_id: str = Field(min_length=1, max_length=20)


class GoogleSessionIn(BaseModel):
    session_id: str


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
    if card["event_type"] in COUPLE_TYPES and card.get("secondary_name"):
        return f"{card['primary_name']} & {card['secondary_name']}"
    return card["primary_name"]


def card_photos(card):
    return [*card.get("photos", []), card.get("wishes_photo", ""), *[e.get("photo", "") for e in card.get("events", [])]]


def check_photos(body: CardIn, user, existing=None):
    prefix = f"{STORAGE_PREFIX}/uploads/{user['user_id']}/"
    kept = set(card_photos(existing or {}))
    paths = [*body.photos, body.wishes_photo, *[e.photo for e in body.events]]
    if any(p and not p.startswith(prefix) and p not in kept for p in paths):
        raise HTTPException(422, "Invalid photo")


def clean_phone(raw):
    plus = raw.strip().startswith("+")
    d = re.sub(r"\D", "", raw)
    if not plus and len(d) == 11 and d.startswith("0"):
        d = d[1:]
    if not plus and len(d) == 10:
        d = "91" + d
    return f"+{d}" if 8 <= len(d) <= 15 else ""


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


LOCAL_DATES = {
    "hi": (["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"],
           ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्तूबर", "नवंबर", "दिसंबर"],
           ("पूर्वाह्न", "अपराह्न"), ","),
    "ur": (["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ", "اتوار"],
           ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"],
           ("صبح", "شام"), "،"),
}


def display_date(ev, lang="en"):
    d = datetime.strptime(f"{ev['date']} {ev['time']}", "%Y-%m-%d %H:%M")
    if lang in LOCAL_DATES:
        days, months, ampm, comma = LOCAL_DATES[lang]
        return (f"{days[d.weekday()]}{comma} {d.day} {months[d.month - 1]} {d.year}",
                f"{d.strftime('%I:%M').lstrip('0')} {ampm[d.hour >= 12]}")
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


async def adopt_phone_cards(admin_id):
    """Phone login was removed: cards of former phone accounts move to the admin account."""
    phone_ids = [u["user_id"] async for u in db.users.find({"auth_provider": "phone"}, {"_id": 0, "user_id": 1})]
    if phone_ids:
        await db.cards.update_many({"owner_id": {"$in": phone_ids}}, {"$set": {"owner_id": admin_id}})
        await db.user_sessions.delete_many({"user_id": {"$in": phone_ids}})


@api.post("/auth/google/session")
async def google_session(body: GoogleSessionIn, response: Response):
    r = await asyncio.to_thread(requests.get, EMERGENT_SESSION_URL,
                                headers={"X-Session-ID": body.session_id}, timeout=15)
    if r.status_code != 200:
        raise HTTPException(401, "Google sign-in failed")
    data = r.json()
    is_admin = data["email"].lower() == ADMIN_EMAIL
    user = await db.users.find_one({"email": data["email"], "auth_provider": "google"}, {"_id": 0})
    if user:
        await db.users.update_one({"user_id": user["user_id"]},
                                  {"$set": {"name": data.get("name", ""), "picture": data.get("picture", ""), "is_admin": is_admin}})
    else:
        user = {"user_id": f"user_{uuid.uuid4().hex[:12]}", "auth_provider": "google", "email": data["email"],
                "name": data.get("name", ""), "picture": data.get("picture", ""), "is_admin": is_admin,
                "created_at": now().isoformat()}
        await db.users.insert_one(dict(user))
    if is_admin:
        await adopt_phone_cards(user["user_id"])
    await create_session(user["user_id"], response, data["session_token"])
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    auth = request.headers.get("Authorization", "")
    token = token or (auth[7:] if auth.startswith("Bearer ") else None)
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
    match = {"$match": {"card_id": {"$in": [c["card_id"] for c in cards]}}}
    guests, wishes = {}, {}
    async for row in db.guests.aggregate([match, {"$group": {
            "_id": "$card_id", "guests": {"$sum": 1},
            "opened": {"$sum": {"$cond": [{"$ifNull": ["$opened_at", False]}, 1, 0]}}}}]):
        guests[row["_id"]] = row
    async for row in db.wishes.aggregate([match, {"$group": {"_id": "$card_id", "n": {"$sum": 1}}}]):
        wishes[row["_id"]] = row["n"]
    for c in cards:
        g = guests.get(c["card_id"], {})
        c["stats"] = {"guests": g.get("guests", 0), "opened": g.get("opened", 0), "wishes": wishes.get(c["card_id"], 0)}
    return cards


def require_terms(body: CardIn):
    if body.status == "published" and not body.agreed_terms:
        raise HTTPException(422, "Please agree to the Terms and Privacy Policy before publishing")


@api.post("/cards")
async def create_card(body: CardIn, user: dict = Depends(current_user)):
    check_photos(body, user)
    require_terms(body)
    ts = now().isoformat()
    base = slugify("-".join(filter(None, [body.primary_name, body.secondary_name if body.event_type in COUPLE_TYPES else ""])))
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
    existing = await owned_card(card_id, user)
    check_photos(body, user, existing)
    require_terms(body)
    update = {**body.model_dump(), "events": assign_event_ids(body.events), "updated_at": now().isoformat()}
    await db.cards.update_one({"card_id": card_id}, {"$set": update})
    return await owned_card(card_id, user)


@api.delete("/cards/{card_id}")
async def delete_card(card_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    await db.cards.delete_one({"card_id": card_id})
    await db.guests.delete_many({"card_id": card_id})
    await db.wishes.delete_many({"card_id": card_id})
    return {"ok": True}


@api.get("/cards/{card_id}/wishes")
async def card_wishes(card_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    return await db.wishes.find({"card_id": card_id}, {"_id": 0}).sort("created_at", -1).to_list(500)


# ---------- Guest list ----------
def guest_events(card, ids):
    valid = [e["event_id"] for e in card["events"]]
    picked = [i for i in valid if i in set(ids)]
    return picked or valid


@api.get("/cards/{card_id}/guests")
async def list_guests(card_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    return await db.guests.find({"card_id": card_id}, {"_id": 0}).sort("created_at", 1).to_list(5000)


@api.post("/cards/{card_id}/guests/bulk")
async def add_guests(card_id: str, body: GuestBulkIn, user: dict = Depends(current_user)):
    card = await owned_card(card_id, user)
    existing = await db.guests.find({"card_id": card_id}, {"_id": 0, "guest_id": 1, "name": 1, "phone": 1}).to_list(5000)
    seen = {g["phone"] or g["name"].lower(): g["guest_id"] for g in existing}
    docs, skipped, merged = [], 0, 0
    for g in body.guests:
        name = re.sub(r"\s+", " ", g.name.strip())
        phone = clean_phone(g.phone)
        key = phone or name.lower()
        if not name:
            skipped += 1
            continue
        if key in seen:
            if body.on_duplicate == "merge" and seen[key]:
                await db.guests.update_one({"card_id": card_id, "guest_id": seen[key]}, {"$set": {"name": name}})
                merged += 1
            else:
                skipped += 1
            continue
        seen[key] = None
        docs.append({"guest_id": uuid.uuid4().hex[:10], "card_id": card_id, "name": name, "phone": phone,
                     "event_ids": guest_events(card, g.event_ids), "sent_at": None, "opened_at": None,
                     "open_count": 0, "created_at": now().isoformat()})
    if docs:
        await db.guests.insert_many([dict(d) for d in docs])
    return {"added": len(docs), "skipped": skipped, "merged": merged, "guests": docs}


@api.post("/cards/{card_id}/guests/bulk-delete")
async def bulk_delete_guests(card_id: str, body: GuestIdsIn, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    res = await db.guests.delete_many({"card_id": card_id, "guest_id": {"$in": body.guest_ids}})
    return {"deleted": res.deleted_count}


@api.post("/cards/{card_id}/guests/bulk-rename")
async def bulk_rename_guests(card_id: str, body: GuestRenameIn, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    for g in body.guests:
        await db.guests.update_one({"card_id": card_id, "guest_id": g.guest_id},
                                   {"$set": {"name": re.sub(r"\s+", " ", g.name.strip())}})
    return await db.guests.find({"card_id": card_id}, {"_id": 0}).sort("created_at", 1).to_list(5000)


@api.put("/cards/{card_id}/invite-template")
async def set_invite_template(card_id: str, body: InviteTemplateIn, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    await db.cards.update_one({"card_id": card_id}, {"$set": {"invite_template": body.template.strip()}})
    return await owned_card(card_id, user)


@api.delete("/cards/{card_id}/guests/{guest_id}/sent")
async def undo_sent(card_id: str, guest_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    res = await db.guests.update_one({"card_id": card_id, "guest_id": guest_id}, {"$set": {"sent_at": None}})
    if not res.matched_count:
        raise HTTPException(404, "Guest not found")
    return await db.guests.find_one({"guest_id": guest_id}, {"_id": 0})


@api.put("/cards/{card_id}/guests/{guest_id}")
async def update_guest(card_id: str, guest_id: str, body: GuestIn, user: dict = Depends(current_user)):
    card = await owned_card(card_id, user)
    phone = clean_phone(body.phone)
    if body.phone.strip() and not phone:
        raise HTTPException(422, "Enter a valid phone number")
    if phone and await db.guests.find_one({"card_id": card_id, "phone": phone, "guest_id": {"$ne": guest_id}}, {"_id": 1}):
        raise HTTPException(409, "Another guest already has this number")
    res = await db.guests.update_one({"card_id": card_id, "guest_id": guest_id}, {"$set": {
        "name": re.sub(r"\s+", " ", body.name.strip()), "phone": phone,
        "event_ids": guest_events(card, body.event_ids)}})
    if not res.matched_count:
        raise HTTPException(404, "Guest not found")
    return await db.guests.find_one({"guest_id": guest_id}, {"_id": 0})


@api.delete("/cards/{card_id}/guests/{guest_id}")
async def delete_guest(card_id: str, guest_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    res = await db.guests.delete_one({"card_id": card_id, "guest_id": guest_id})
    if not res.deleted_count:
        raise HTTPException(404, "Guest not found")
    return {"ok": True}


@api.post("/cards/{card_id}/guests/{guest_id}/sent")
async def mark_sent(card_id: str, guest_id: str, user: dict = Depends(current_user)):
    await owned_card(card_id, user)
    res = await db.guests.update_one({"card_id": card_id, "guest_id": guest_id}, {"$set": {"sent_at": now().isoformat()}})
    if not res.matched_count:
        raise HTTPException(404, "Guest not found")
    return await db.guests.find_one({"guest_id": guest_id}, {"_id": 0})


# ---------- Uploads ----------
@api.post("/uploads")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(current_user)):
    ext = ALLOWED_IMG.get(file.content_type)
    if not ext:
        raise HTTPException(415, "Please upload a JPG, PNG or WebP image")
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "Image is too large (max 8 MB)")
    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = img.format
            img.verify()
    except Exception:  # noqa: BLE001
        raise HTTPException(415, "Please upload a JPG, PNG or WebP image")
    if fmt not in {"JPEG", "PNG", "WEBP"}:
        raise HTTPException(415, "Please upload a JPG, PNG or WebP image")
    path = f"{STORAGE_PREFIX}/uploads/{user['user_id']}/{uuid.uuid4().hex}.{ext}"
    result = await asyncio.to_thread(put_object, path, data, file.content_type)
    await db.files.insert_one({"file_id": uuid.uuid4().hex, "storage_path": result["path"], "owner_id": user["user_id"],
                               "content_type": file.content_type, "size": len(data), "is_deleted": False,
                               "created_at": now().isoformat()})
    return {"path": result["path"]}


@api.get("/files/{path:path}")
async def get_file(path: str):
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "File not found")
    data, _ = await asyncio.to_thread(get_object, path)
    return Response(data, media_type=rec["content_type"], headers={"Cache-Control": "public, max-age=31536000, immutable"})


# ---------- Public (guests) ----------
async def public_card(slug):
    card = await db.cards.find_one({"slug": slug, "status": "published"}, {"_id": 0, "owner_id": 0})
    if not card:
        raise HTTPException(404, "Invitation not found")
    return card


@api.get("/public/cards/{slug}")
async def get_public_card(slug: str):
    return await public_card(slug)


@api.post("/public/cards/{slug}/opened")
async def mark_opened(slug: str, body: OpenIn):
    card = await public_card(slug)
    q = {"card_id": card["card_id"], "guest_id": body.guest_id}
    guest = await db.guests.find_one(q, {"_id": 0})
    if not guest:
        raise HTTPException(404, "Guest not found")
    ts = now().isoformat()
    await db.guests.update_one(q, {"$inc": {"open_count": 1}, "$set": {"last_opened_at": ts,
                                                                       "opened_at": guest.get("opened_at") or ts}})
    return {"name": guest["name"], "event_ids": guest["event_ids"]}


@api.post("/public/cards/{slug}/wishes")
async def send_wish(slug: str, body: WishIn):
    card = await public_card(slug)
    name = re.sub(r"\s+", " ", body.guest_name.strip())
    message = body.message.strip()
    if not name or not message:
        raise HTTPException(422, "Name and message are required")
    ev = find_event(card, body.event_id)
    recent = (now() - timedelta(minutes=2)).isoformat()
    dup = await db.wishes.find_one({"card_id": card["card_id"], "guest_name": name, "message": message,
                                    "created_at": {"$gte": recent}}, {"_id": 0})
    if dup:
        return dup
    doc = {"wish_id": uuid.uuid4().hex[:12], "card_id": card["card_id"], "event_id": ev["event_id"],
           "event_name": ev["name"], "guest_name": name, "guest_id": body.guest_id, "message": message,
           "created_at": now().isoformat()}
    await db.wishes.insert_one(dict(doc))
    return doc


def ics_escape(s):
    return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def ics_description(card, ev):
    return "\n".join(filter(None, [card.get("title", ""), meal_line(ev, card.get("language", "en"))]))


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
        f"DESCRIPTION:{ics_escape(ics_description(card, ev))}", f"LOCATION:{ics_escape(location)}",
        "END:VEVENT", "END:VCALENDAR", "",
    ])
    return Response(body, media_type="text/calendar; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{slug}-{ev["event_id"]}.ics"'})


@api.get("/og/{slug}/{event_id}.png")
async def og_image(slug: str, event_id: str):
    card = await public_card(slug)
    ev = find_event(card, event_id)
    date_s, time_s = display_date(ev, card.get("language", "en"))
    photo = None
    path = (card.get("photos") or [""])[0]
    if path and await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 1}):
        try:
            photo, _ = await asyncio.to_thread(get_object, path)
        except Exception as e:  # noqa: BLE001
            logger.warning(f"OG photo fetch failed: {e}")
    png = await asyncio.to_thread(
        render_og, card["template"], EYEBROWS.get(card.get("language", "en"), EYEBROWS["en"])[card["event_type"]], names_line(card),
        ev["name"], f"{date_s}  ·  {time_s}", ", ".join(filter(None, [ev["venue_name"], ev["venue_address"]]))[:80],
        BRAND_NAME, photo, event_scheme(card, ev),
    )
    return Response(png, media_type="image/png", headers={"Cache-Control": "public, max-age=300"})


@api.get("/s/{slug}/{event_id}", response_class=HTMLResponse)
async def share_page(slug: str, event_id: str, request: Request, to: str = "", g: str = ""):
    card = await public_card(slug)
    ev = find_event(card, event_id)
    base = public_base(request)
    to = to.strip()[:80]
    params = {k: v for k, v in {"to": to, "g": g.strip()[:20]}.items() if v}
    path = f"/i/{slug}" if event_id == "cover" else f"/i/{slug}/{ev['event_id']}"
    target = f"{base}{path}" + (f"?{urlencode(params)}" if params else "")
    date_s, time_s = display_date(ev)
    title = f"{intro_title(card)} · {names_line(card)}"
    if to:
        title = f"{INVITED.get(card.get('language', 'en'), INVITED['en']).format(to=to)} {title}"
    desc = " · ".join(filter(None, [f"{date_s} at {time_s}", meal_name(ev, card.get("language", "en")), ev["venue_name"]]))
    version = hashlib.md5(f"{card['updated_at']}{event_scheme(card, ev)}".encode()).hexdigest()[:8]
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
app.include_router(build_site_router(db, current_user, now))
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
    await db.guests.create_index([("card_id", 1), ("guest_id", 1)], unique=True)
    await db.wishes.create_index([("card_id", 1), ("created_at", -1)])
    await db.files.create_index("storage_path")
    try:
        await asyncio.to_thread(init_storage)
    except Exception as e:  # noqa: BLE001
        logger.error(f"Storage init failed: {e}")
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.callbacks.create_index([("mobile", 1), ("created_at", -1)])
    await db.otp_codes.drop()
    admin = await db.users.find_one({"email": ADMIN_EMAIL, "auth_provider": "google"}, {"_id": 0, "user_id": 1})
    if admin:
        await adopt_phone_cards(admin["user_id"])
    for card in DEMO_CARDS:
        await db.cards.replace_one({"card_id": card["card_id"]}, card, upsert=True)
    logger.info("Demo cards seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
