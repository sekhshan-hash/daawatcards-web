import csv
import hashlib
import hmac
import io
import json
import os
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel, Field

PAID = {"paid", "paid_without_payment"}
MOCK_SECRET = "mock_key_secret"
MOCK_WEBHOOK_SECRET = "mock_webhook_secret"
PLAN_DEFAULTS = {"price_paise": 9900, "gst_rate": 18.0, "free_guest_limit": 2}


def payment_mode():
    mode = os.environ.get("PAYMENT_MODE", "mock")
    return mode if mode in ("mock", "test", "live") else "mock"


def key_secret():
    return MOCK_SECRET if payment_mode() == "mock" else os.environ["RAZORPAY_KEY_SECRET"]


def sign(secret, msg):
    return hmac.new(secret.encode(), msg.encode() if isinstance(msg, str) else msg, hashlib.sha256).hexdigest()


def breakdown(cfg):
    base = int(cfg["price_paise"])
    gst = round(base * float(cfg["gst_rate"]) / 100)
    return {"base": base, "gst": gst, "total": base + gst, "gst_rate": float(cfg["gst_rate"]), "currency": "INR"}


def grant_active(g, now):
    return bool(g) and (not g.get("until") or g["until"] >= now.date().isoformat())


async def plan_config(db):
    doc = await db.settings.find_one({"key": "site"}, {"_id": 0}) or {}
    return {k: doc.get(k, v) for k, v in PLAN_DEFAULTS.items()}


async def effective_plan(db, card, now):
    plan = card.get("plan", "free")
    if plan == "paid":
        return "paid"
    if plan == "paid_without_payment" and grant_active(card.get("grant") or {"until": ""}, now):
        return plan
    owner = await db.users.find_one({"user_id": card.get("owner_id")}, {"_id": 0, "account_grant": 1}) or {}
    return "paid_without_payment" if grant_active(owner.get("account_grant"), now) else "free"


async def guest_limit(db, card, now):
    """None = unlimited; otherwise the free plan's guest cap."""
    if await effective_plan(db, card, now) in PAID:
        return None
    return int((await plan_config(db))["free_guest_limit"])


def invoice_pdf(p, company, gstin, address):
    img = Image.new("RGB", (1240, 1754), "white")
    d = ImageDraw.Draw(img)
    try:
        big, reg = ImageFont.truetype("DejaVuSans-Bold.ttf", 44), ImageFont.truetype("DejaVuSans.ttf", 28)
    except OSError:
        big = reg = ImageFont.load_default()
    rs = lambda paise: f"Rs. {paise / 100:,.2f}"  # noqa: E731
    lines = [(big, "TAX INVOICE"), (reg, ""), (reg, company), (reg, address), (reg, f"GSTIN: {gstin or '-'}"), (reg, ""),
             (reg, f"Invoice number: {p['invoice_no']}"), (reg, f"Date: {p['paid_at'][:10]}"),
             (reg, f"Billed to: {p.get('host_name') or p.get('host_email')}"), (reg, f"Card: {p.get('card_name', '')}"), (reg, ""),
             (reg, "Daawat Paid plan (one card, one-time)"), (reg, f"Amount: {rs(p['base'])}"),
             (reg, f"GST @ {p['gst_rate']:g}%: {rs(p['gst'])}"), (big, f"Total: {rs(p['total'])}"), (reg, ""),
             (reg, f"Payment ID: {p.get('payment_id', '')}"), (reg, f"Order ID: {p['order_id']}")]
    if p["mode"] == "mock":
        lines.append((big, "MOCK PAYMENT - NO MONEY CHARGED"))
    y = 120
    for f, text in lines:
        d.text((100, y), text, fill="black", font=f)
        y += 64 if f is big else 46
    buf = io.BytesIO()
    img.save(buf, "PDF", resolution=150)
    return buf.getvalue()


class OrderIn(BaseModel):
    agreed_terms: bool


class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class GrantIn(BaseModel):
    note: str = Field(min_length=2, max_length=200)
    until: str = Field(default="", pattern=r"^(|\d{4}-\d{2}-\d{2})$")


class CardAdminIn(BaseModel):
    disabled: bool


def build_billing_router(db, current_user, now, owned_card, admin_user):
    r = APIRouter(prefix="/api")

    async def audit(admin, action, target, note=""):
        await db.audit.insert_one({"at": now().isoformat(), "admin": admin["email"], "action": action, "target": target, "note": note})

    async def mark_paid(order_id, payment_id, source):
        p = await db.payments.find_one({"order_id": order_id}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Order not found")
        if p["status"] == "captured":
            return p
        n = await db.counters.find_one_and_update({"key": "invoice"}, {"$inc": {"n": 1}}, upsert=True, return_document=True)
        upd = {"status": "captured", "payment_id": payment_id, "paid_at": now().isoformat(), "captured_by": source,
               "invoice_no": f"DW-{now().year}-{n['n']:05d}"}
        res = await db.payments.update_one({"order_id": order_id, "status": {"$ne": "captured"}}, {"$set": upd})
        if res.modified_count:
            await db.cards.update_one({"card_id": p["card_id"]}, {"$set": {"plan": "paid", "paid_payment_id": order_id}})
        return await db.payments.find_one({"order_id": order_id}, {"_id": 0})

    @r.get("/billing/cards/{card_id}")
    async def billing_card(card_id: str, user: dict = Depends(current_user)):
        card = await owned_card(card_id, user)
        plan = await effective_plan(db, card, now())
        cfg = await plan_config(db)
        used = await db.guests.count_documents({"card_id": card_id})
        pays = await db.payments.find({"card_id": card_id, "status": "captured"}, {"_id": 0}).to_list(20)
        return {"plan": plan, "limit": None if plan in PAID else cfg["free_guest_limit"], "used": used,
                "price": breakdown(cfg), "mode": payment_mode(), "payments": pays}

    @r.get("/billing/config")
    async def billing_config():
        cfg = await plan_config(db)
        return {"price": breakdown(cfg), "free_guest_limit": cfg["free_guest_limit"], "mode": payment_mode()}

    @r.post("/billing/cards/{card_id}/order")
    async def create_order(card_id: str, body: OrderIn, user: dict = Depends(current_user)):
        card = await owned_card(card_id, user)
        if not body.agreed_terms:
            raise HTTPException(422, "Please agree to the Terms and Privacy Policy first")
        if card.get("plan") == "paid":
            raise HTTPException(409, "This card is already paid")
        price, mode = breakdown(await plan_config(db)), payment_mode()
        if mode == "mock":
            order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        else:
            res = requests.post("https://api.razorpay.com/v1/orders", auth=(os.environ["RAZORPAY_KEY_ID"], key_secret()), timeout=20,
                                json={"amount": price["total"], "currency": "INR", "receipt": card_id[:40], "payment_capture": 1})
            if res.status_code >= 300:
                raise HTTPException(502, "Could not start the payment. Please try again.")
            order_id = res.json()["id"]
        names = " & ".join(filter(None, [card["primary_name"], card.get("secondary_name")]))
        await db.payments.insert_one({"order_id": order_id, "card_id": card_id, "host_id": user["user_id"], "host_email": user.get("email"),
                                      "host_name": user.get("name"), "card_name": names, **price, "status": "created", "mode": mode,
                                      "created_at": now().isoformat()})
        return {"order_id": order_id, "amount": price["total"], "currency": "INR", "mode": mode, "price": price,
                "key_id": os.environ.get("RAZORPAY_KEY_ID") if mode != "mock" else None, "name": names}

    @r.post("/billing/verify")
    async def verify(body: VerifyIn, user: dict = Depends(current_user)):
        p = await db.payments.find_one({"order_id": body.razorpay_order_id, "host_id": user["user_id"]}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Order not found")
        expected = sign(key_secret(), f"{body.razorpay_order_id}|{body.razorpay_payment_id}")
        if not hmac.compare_digest(expected, body.razorpay_signature):
            await db.payments.update_one({"order_id": p["order_id"], "status": "created"}, {"$set": {"status": "failed"}})
            raise HTTPException(400, "Payment could not be verified")
        return await mark_paid(body.razorpay_order_id, body.razorpay_payment_id, "checkout")

    @r.post("/billing/mock/{order_id}/{outcome}")
    async def mock_outcome(order_id: str, outcome: Literal["success", "failure"], user: dict = Depends(current_user)):
        if payment_mode() != "mock":
            raise HTTPException(404, "Not found")
        p = await db.payments.find_one({"order_id": order_id, "host_id": user["user_id"]}, {"_id": 0})
        if not p:
            raise HTTPException(404, "Order not found")
        if outcome == "failure":
            await db.payments.update_one({"order_id": order_id, "status": "created"}, {"$set": {"status": "failed"}})
            return {"status": "failed"}
        pay_id = f"pay_mock_{uuid.uuid4().hex[:14]}"
        return {"razorpay_order_id": order_id, "razorpay_payment_id": pay_id, "razorpay_signature": sign(MOCK_SECRET, f"{order_id}|{pay_id}")}

    @r.post("/webhooks/razorpay")
    async def webhook(request: Request):
        raw = await request.body()
        secret = MOCK_WEBHOOK_SECRET if payment_mode() == "mock" else os.environ["RAZORPAY_WEBHOOK_SECRET"]
        if not hmac.compare_digest(sign(secret, raw), request.headers.get("X-Razorpay-Signature", "")):
            raise HTTPException(400, "Invalid signature")
        event = json.loads(raw)
        ent = event.get("payload", {}).get("payment", {}).get("entity", {})
        if event.get("event") == "payment.captured" and ent.get("order_id"):
            p = await db.payments.find_one({"order_id": ent["order_id"]}, {"_id": 0, "total": 1, "currency": 1})
            if not p or ent.get("amount") != p["total"] or ent.get("currency", "INR") != p["currency"]:
                raise HTTPException(400, "Amount mismatch")
            await mark_paid(ent["order_id"], ent.get("id", ""), "webhook")
        elif event.get("event") == "payment.failed" and ent.get("order_id"):
            await db.payments.update_one({"order_id": ent["order_id"], "status": "created"}, {"$set": {"status": "failed"}})
        return {"ok": True}

    @r.get("/billing/payments/{order_id}")
    async def payment_detail(order_id: str, user: dict = Depends(current_user)):
        q = {"order_id": order_id} if user.get("is_admin") else {"order_id": order_id, "host_id": user["user_id"]}
        p = await db.payments.find_one(q, {"_id": 0})
        if not p:
            raise HTTPException(404, "Payment not found")
        return p

    @r.get("/billing/payments/{order_id}/invoice.pdf")
    async def invoice(order_id: str, user: dict = Depends(current_user)):
        p = await payment_detail(order_id, user)
        if p["status"] != "captured":
            raise HTTPException(409, "No invoice for unpaid orders")
        s = await db.settings.find_one({"key": "site"}, {"_id": 0}) or {}
        pdf = invoice_pdf(p, s.get("company", "Save money solutions"), s.get("gstin", ""), s.get("address", ""))
        return Response(pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{p["invoice_no"]}.pdf"'})

    # ---------- Admin ----------
    async def user_categories():
        paid_owners = set(await db.cards.distinct("owner_id", {"plan": "paid"}))
        pwp_owners = set(await db.cards.distinct("owner_id", {"plan": "paid_without_payment"}))
        acct = {u["user_id"] async for u in db.users.find({"account_grant": {"$ne": None}}, {"_id": 0, "user_id": 1, "account_grant": 1})
                if grant_active(u.get("account_grant"), now())}

        def cat(uid):
            return "paid" if uid in paid_owners else "paid_without_payment" if uid in pwp_owners | acct else "free"
        return cat

    @r.get("/admin/overview")
    async def overview(_: dict = Depends(admin_user)):
        cat = await user_categories()
        users = await db.users.find({"auth_provider": "google"}, {"_id": 0, "user_id": 1, "created_at": 1}).to_list(100000)
        counts = Counter(cat(u["user_id"]) for u in users)
        per_day = Counter(str(u.get("created_at", ""))[:10] for u in users)
        days = [(now().date() - timedelta(days=i)).isoformat() for i in range(29, -1, -1)]
        plans = Counter([c.get("plan", "free") async for c in db.cards.find({}, {"_id": 0, "plan": 1})])
        return {"users": len(users), "categories": {k: counts.get(k, 0) for k in ("free", "paid", "paid_without_payment")},
                "new_users": [{"day": d, "n": per_day.get(d, 0)} for d in days],
                "cards": {k: plans.get(k, 0) for k in ("free", "paid", "paid_without_payment")}, "mode": payment_mode()}

    @r.get("/admin/users")
    async def admin_users(q: str = "", _: dict = Depends(admin_user)):
        cat = await user_categories()
        flt = {"auth_provider": "google"}
        if q:
            flt["$or"] = [{"email": {"$regex": q, "$options": "i"}}, {"name": {"$regex": q, "$options": "i"}}]
        users = await db.users.find(flt, {"_id": 0}).sort("created_at", -1).to_list(500)
        n = Counter([c["owner_id"] async for c in db.cards.find({}, {"_id": 0, "owner_id": 1})])
        return [{**u, "cards": n.get(u["user_id"], 0), "category": cat(u["user_id"])} for u in users]

    @r.get("/admin/cards")
    async def admin_cards(plan: str = "", _: dict = Depends(admin_user)):
        cards = await db.cards.find({}, {"_id": 0, "card_id": 1, "slug": 1, "primary_name": 1, "secondary_name": 1, "plan": 1, "template": 1,
                                         "event_type": 1, "created_at": 1, "owner_id": 1, "status": 1, "disabled": 1, "grant": 1, "events": 1}).sort("created_at", -1).to_list(2000)
        emails = {u["user_id"]: u.get("email") async for u in db.users.find({}, {"_id": 0, "user_id": 1, "email": 1})}
        acct = {u["user_id"] async for u in db.users.find({"account_grant": {"$ne": None}}, {"_id": 0, "user_id": 1, "account_grant": 1})
                if grant_active(u.get("account_grant"), now())}

        def eff(c):
            p = c.get("plan", "free")
            if p == "paid_without_payment" and not grant_active(c.get("grant") or {"until": ""}, now()):
                p = "free"
            return "paid_without_payment" if p == "free" and c["owner_id"] in acct else p
        rows = [{**c, "plan": eff(c), "owner_email": emails.get(c["owner_id"], c["owner_id"]),
                 "dates": sorted(e["date"] for e in c.pop("events", []) if e.get("date"))} for c in cards]
        return [r for r in rows if not plan or r["plan"] == plan]

    @r.get("/admin/free-events")
    async def free_events(_: dict = Depends(admin_user)):
        today = now().date()
        rows = []
        for c in await admin_cards("free", _):
            future = [d for d in c["dates"] if d >= today.isoformat()]
            if future:
                rows.append({**c, "next_date": future[0], "days_left": (datetime.fromisoformat(future[0]).date() - today).days})
        return sorted(rows, key=lambda x: x["next_date"])

    @r.post("/admin/cards/{card_id}/grant")
    async def grant_card(card_id: str, body: GrantIn, admin: dict = Depends(admin_user)):
        card = await db.cards.find_one({"card_id": card_id}, {"_id": 0, "plan": 1})
        if not card:
            raise HTTPException(404, "Card not found")
        if card.get("plan") == "paid":
            raise HTTPException(409, "This card is already paid")
        await db.cards.update_one({"card_id": card_id}, {"$set": {"plan": "paid_without_payment", "grant": {**body.model_dump(), "by": admin["email"], "at": now().isoformat()}}})
        await audit(admin, "grant_card", card_id, body.note)
        return {"ok": True}

    @r.post("/admin/cards/{card_id}/revoke")
    async def revoke_card(card_id: str, admin: dict = Depends(admin_user)):
        paid = await db.payments.find_one({"card_id": card_id, "status": "captured", "mode": {"$ne": "mock"}}, {"_id": 1})
        await db.cards.update_one({"card_id": card_id}, {"$set": {"plan": "paid" if paid else "free", "grant": None}})
        await audit(admin, "revoke_card", card_id)
        return {"ok": True}

    @r.patch("/admin/cards/{card_id}")
    async def disable_card(card_id: str, body: CardAdminIn, admin: dict = Depends(admin_user)):
        if not (await db.cards.update_one({"card_id": card_id}, {"$set": {"disabled": body.disabled}})).matched_count:
            raise HTTPException(404, "Card not found")
        await audit(admin, "disable_card" if body.disabled else "enable_card", card_id)
        return {"ok": True}

    @r.delete("/admin/cards/{card_id}")
    async def delete_card(card_id: str, admin: dict = Depends(admin_user)):
        if not (await db.cards.delete_one({"card_id": card_id})).deleted_count:
            raise HTTPException(404, "Card not found")
        await db.guests.delete_many({"card_id": card_id})
        await audit(admin, "delete_card", card_id)
        return {"ok": True}

    @r.post("/admin/users/{user_id}/grant")
    async def grant_user(user_id: str, body: GrantIn, admin: dict = Depends(admin_user)):
        res = await db.users.update_one({"user_id": user_id}, {"$set": {"account_grant": {**body.model_dump(), "by": admin["email"], "at": now().isoformat()}}})
        if not res.matched_count:
            raise HTTPException(404, "User not found")
        await audit(admin, "grant_user", user_id, body.note)
        return {"ok": True}

    @r.post("/admin/users/{user_id}/revoke")
    async def revoke_user(user_id: str, admin: dict = Depends(admin_user)):
        await db.users.update_one({"user_id": user_id}, {"$set": {"account_grant": None}})
        await audit(admin, "revoke_user", user_id)
        return {"ok": True}

    async def real_payments(start, end, include_mock=False):
        flt = {"status": "captured", "paid_at": {"$gte": start or "0", "$lte": (end or "9999") + "~"}}
        if not include_mock:
            flt["mode"] = {"$ne": "mock"}
        return await db.payments.find(flt, {"_id": 0}).sort("paid_at", -1).to_list(10000)

    @r.get("/admin/revenue")
    async def revenue(start: str = "", end: str = "", include_mock: bool = False, _: dict = Depends(admin_user)):
        pays = await real_payments(start, end, include_mock)
        real = [p for p in pays if p["mode"] != "mock"]
        group = {k: defaultdict(lambda: {"base": 0, "gst": 0, "total": 0, "n": 0}) for k in ("daily", "monthly", "yearly")}
        for p in real:
            for k, n in (("daily", 10), ("monthly", 7), ("yearly", 4)):
                g = group[k][p["paid_at"][:n]]
                for f in ("base", "gst", "total"):
                    g[f] += p[f]
                g["n"] += 1
        totals = {f: sum(p[f] for p in real) for f in ("base", "gst", "total")}
        pwp = await db.cards.count_documents({"plan": "paid_without_payment"})
        return {"totals": totals, "count": len(real), "paid_without_payment_cards": pwp, "payments": pays,
                **{k: [{"period": p, **v} for p, v in sorted(g.items())] for k, g in group.items()}}

    @r.get("/admin/revenue.csv")
    async def revenue_csv(start: str = "", end: str = "", include_mock: bool = False, _: dict = Depends(admin_user)):
        buf = io.StringIO()
        w = csv.writer(buf)
        cols = ["paid_at", "invoice_no", "order_id", "payment_id", "card_id", "host_email", "base", "gst", "total", "mode"]
        w.writerow(cols)
        for p in await real_payments(start, end, include_mock):
            w.writerow([p.get(c, "") if c not in ("base", "gst", "total") else f"{p[c] / 100:.2f}" for c in cols])
        return Response(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="daawat-payments.csv"'})

    @r.get("/admin/audit")
    async def audit_log(_: dict = Depends(admin_user)):
        return await db.audit.find({}, {"_id": 0}).sort("at", -1).to_list(300)

    return r


async def migrate_plans(db, now: Optional[datetime] = None):
    """Cards created before plans existed keep full access as a launch grant."""
    ts = (now or datetime.now(timezone.utc)).isoformat()
    res = await db.cards.update_many({"plan": {"$exists": False}}, {"$set": {"plan": "paid_without_payment",
                                     "grant": {"note": "launch grant (card existed before plans)", "until": "", "by": "system", "at": ts}}})
    if res.modified_count:
        await db.audit.insert_one({"at": ts, "admin": "system", "action": "launch_grant", "target": f"{res.modified_count} cards", "note": ""})
