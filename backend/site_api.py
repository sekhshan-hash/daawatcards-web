import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from mailer import send_mail

SUPPORT_EMAIL = "info.Daawatcards@gmail.com"

TERMS = """Daawat ('the Service') is a digital invitation card platform operated by {company} ('we', 'us'). By using the website you agree to these Terms.

1. About us. Daawat ('the Service') is a digital invitation card platform operated by {company} ('we', 'us'). By using the website you agree to these Terms.

2. The Service. Hosts create animated digital invitation cards and share links with guests. The Free plan lets a host create a card and send it to up to two people, and the card shows a Daawat watermark. The Paid plan (Rs. 99 plus applicable GST per card) allows sending to any number of guests and removes the watermark for that card. We may also grant paid access to selected users at our discretion.

3. Accounts. You must log in with a valid Google account and provide accurate information. You are responsible for all activity on your account.

4. Payments. Payments are processed by Razorpay. Prices are in Indian Rupees and exclude GST unless stated. The Paid plan is a one-time payment per card. We do not store your card or bank details.

5. Refunds and cancellation. See our Refund & Cancellation Policy.

6. Your content. You own the text and photo you add. You confirm that you have the right to use them and to contact the guests you add. You must not upload unlawful, obscene, hateful, defamatory or infringing content. We may disable cards that break these Terms.

7. Guest information. You are responsible for having your guests' permission to send them the invitation. See our Privacy Policy.

8. Religious and traditional wording. Suggested wording is provided as a convenience; please check it before publishing.

9. Third-party services. Links open WhatsApp, Google Maps and calendar apps, which are separate services. We are not affiliated with WhatsApp, Meta or Google.

10. Availability. We try to keep the Service available but do not guarantee uninterrupted access. Features may change.

11. Limitation of liability. To the extent permitted by law, we are not liable for indirect or consequential losses or for events outside our control. Our total liability is limited to the amount you paid for the affected card.

12. Termination. We may suspend accounts that misuse the Service. You may stop using the Service at any time.

13. Governing law. These Terms are governed by the laws of India, and the courts at Lucknow jurisdiction.

14. Contact. {company}, {address}, {email}."""
TERMS = TERMS.split("\n\n", 1)[1]

PRIVACY = """1. Who we are. Daawat is operated by {company}. This policy explains what we collect and why.

2. What we collect from hosts. When you log in with Google we receive your name, email address and profile picture. We store the cards you create, including names, event details, wording and the photo you upload.

3. What we collect about guests. Hosts may add guest names and mobile numbers so they can send invitations. We record when a guest opens a card and any wishes the guest chooses to send.

4. How we use it. We use this information only to run the Service: to show your cards, send invitation links, display wishes and help you if you contact us. We do not sell personal information.

5. Sharing. We share information only with services that help us run Daawat, such as hosting, file storage, email and payment processing (Razorpay), and only as needed. Card links are public to anyone who has the link.

6. Call-back requests. If you ask us to call you back, we keep your name, number, preferred time and message to respond to you.

7. Retention. We keep your cards until you delete them or close your account. You can ask us to delete your data at any time.

8. Your choices. You can edit or delete your cards and guests from your dashboard. To ask for a copy or deletion of your data, email {email}.

9. Security. We use secure connections and access controls, but no online service can be completely secure.

10. Contact. {company}, {address}, {email}."""

REFUND = """1. Free plan. The Free plan costs nothing, so there is nothing to refund.

2. Paid plan. The Paid plan is a one-time payment of Rs. 99 plus applicable GST per card.

3. Refunds. If you paid but the paid features (unlimited guests, no watermark) did not work for your card, email {email} within 7 days of payment and we will fix it or refund you in full.

4. Change of mind. Because the paid features unlock straight away, we do not normally refund once a paid card has been sent to guests. If the card has not been sent to anyone yet, you may ask for a refund within 7 days of payment.

5. Cancellation. You can stop using a card at any time by deleting it. Deleting a card does not by itself trigger a refund.

6. How refunds are paid. Approved refunds go back to the original payment method through Razorpay, usually within 5 to 7 working days.

7. Contact. {company}, {address}, {email}."""

PRICING = """Free plan: Rs. 0. Create a card and send it to up to two people. The card shows a small Daawat watermark.

Paid plan: Rs. 99 plus applicable GST, per card, one-time. Send to any number of guests and remove the watermark for that card.

Every plan includes animated templates, multi-event pages, one photo, music, fireworks effects, guest names on the card and one-tap WhatsApp sharing.

Payments are processed securely by Razorpay. See our Refund & Cancellation Policy for refunds."""

DEFAULTS = {
    "company": "Save money solutions", "address": "[address]", "email": SUPPORT_EMAIL,
    "hours": "Monday to Saturday, 10:00 am to 6:00 pm IST", "updated": "28 October 2026",
    "terms": TERMS, "privacy": PRIVACY, "refund": REFUND, "pricing": PRICING,
}
PAGES = ("terms", "privacy", "refund", "pricing")


class SettingsIn(BaseModel):
    company: str = Field(min_length=1, max_length=120)
    address: str = Field(default="", max_length=400)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=120)
    hours: str = Field(default="", max_length=200)
    updated: str = Field(default="", max_length=40)
    terms: str = Field(min_length=1, max_length=20000)
    privacy: str = Field(min_length=1, max_length=20000)
    refund: str = Field(min_length=1, max_length=20000)
    pricing: str = Field(min_length=1, max_length=20000)


class CallbackIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    mobile: str = Field(min_length=6, max_length=20)
    time: Literal["morning", "afternoon", "evening"]
    message: str = Field(default="", max_length=500)
    website: str = Field(default="", max_length=200)
    elapsed_ms: int = Field(default=0, ge=0)


class CallbackStatusIn(BaseModel):
    status: Literal["new", "done"]


def indian_mobile(raw):
    d = re.sub(r"\D", "", raw)
    if len(d) == 12 and d.startswith("91"):
        d = d[2:]
    if len(d) == 11 and d.startswith("0"):
        d = d[1:]
    return f"+91{d}" if re.fullmatch(r"[6-9]\d{9}", d) else ""


def build_site_router(db, current_user, now):
    router = APIRouter(prefix="/api")

    async def admin_user(user: dict = Depends(current_user)):
        if not user.get("is_admin"):
            raise HTTPException(403, "Admins only")
        return user

    async def settings():
        doc = await db.settings.find_one({"key": "site"}, {"_id": 0, "key": 0}) or {}
        return {**DEFAULTS, **doc}

    @router.get("/site")
    async def get_site():
        s = await settings()
        fill = {"company": s["company"], "address": s["address"], "email": s["email"]}
        pages = {p: s[p].replace("{company}", fill["company"]).replace("{address}", fill["address"]).replace("{email}", fill["email"]) for p in PAGES}
        return {**{k: s[k] for k in ("company", "address", "email", "hours", "updated")}, "pages": pages}

    @router.get("/admin/settings")
    async def get_settings(_: dict = Depends(admin_user)):
        return await settings()

    @router.put("/admin/settings")
    async def put_settings(body: SettingsIn, _: dict = Depends(admin_user)):
        await db.settings.update_one({"key": "site"}, {"$set": body.model_dump()}, upsert=True)
        return await settings()

    @router.post("/support/callback")
    async def request_callback(body: CallbackIn, request: Request, tasks: BackgroundTasks):
        if body.website or body.elapsed_ms < 2500:
            return {"ok": True}
        mobile = indian_mobile(body.mobile)
        if not mobile:
            raise HTTPException(422, "Enter a valid 10-digit Indian mobile number")
        since = (now() - timedelta(days=1)).isoformat()
        ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "")).split(",")[0].strip()
        if await db.callbacks.count_documents({"mobile": mobile, "created_at": {"$gte": since}}) >= 3:
            raise HTTPException(429, "You have already sent 3 requests today. We will call you soon.")
        if ip and await db.callbacks.count_documents({"ip": ip, "created_at": {"$gte": since}}) >= 10:
            raise HTTPException(429, "Too many requests. Please try again tomorrow.")
        doc = {"request_id": uuid.uuid4().hex[:12], "name": body.name.strip(), "mobile": mobile, "time": body.time,
               "message": body.message.strip(), "status": "new", "ip": ip, "created_at": now().isoformat()}
        await db.callbacks.insert_one(dict(doc))
        s = await settings()
        tasks.add_task(send_mail, s["email"], f"Call-back request: {doc['name']} ({mobile})",
                       f"Name: {doc['name']}\nMobile: {mobile}\nPreferred time: {body.time.title()}\nMessage: {doc['message'] or '-'}\n"
                       f"Requested: {datetime.now(timezone.utc).strftime('%d %b %Y %H:%M UTC')}")
        return {"ok": True}

    @router.get("/admin/callbacks")
    async def list_callbacks(_: dict = Depends(admin_user)):
        return await db.callbacks.find({}, {"_id": 0, "ip": 0}).sort("created_at", -1).to_list(500)

    @router.patch("/admin/callbacks/{request_id}")
    async def set_callback(request_id: str, body: CallbackStatusIn, _: dict = Depends(admin_user)):
        r = await db.callbacks.update_one({"request_id": request_id}, {"$set": {"status": body.status}})
        if not r.matched_count:
            raise HTTPException(404, "Request not found")
        return {"ok": True}

    return router
