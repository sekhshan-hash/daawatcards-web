# Iteration 12: per-card plans (free/paid/paid_without_payment), mock Razorpay billing, webhook, admin dashboard
import hashlib
import hmac
import json
import os
import uuid

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
HOST = {"Authorization": "Bearer test_session_host"}
ADMIN = {"Authorization": "Bearer test_session_admin"}


def _env(key):
    for line in open("/app/backend/.env"):
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"')


db = MongoClient(_env("MONGO_URL"))[_env("DB_NAME")]


def payload(primary="Daawat", secondary="RSVP", status="published"):
    return {"event_type": "wedding", "template": "wedding-royal", "primary_name": primary, "secondary_name": secondary,
            "status": status, "agreed_terms": True,
            "events": [{"event_id": "e1", "name": "Nikah", "date": "2026-02-01", "time": "18:00", "venue_name": "TEST Hall"}]}


def new_card(**kw):
    r = requests.post(f"{API}/cards", json=payload(**kw), headers=HOST)
    assert r.status_code == 200, r.text
    return r.json()


def add(card_id, names):
    return requests.post(f"{API}/cards/{card_id}/guests/bulk", headers=HOST,
                         json={"guests": [{"name": n, "phone": ""} for n in names]})


def pay_mock(card_id):
    o = requests.post(f"{API}/billing/cards/{card_id}/order", json={"agreed_terms": True}, headers=HOST).json()
    s = requests.post(f"{API}/billing/mock/{o['order_id']}/success", headers=HOST).json()
    return o, s


@pytest.fixture(scope="module")
def card():
    db.cards.delete_many({"slug": "daawat-rsvp"})
    c = new_card()
    yield c
    db.cards.delete_one({"card_id": c["card_id"]})
    db.guests.delete_many({"card_id": c["card_id"]})


# ---- Free plan & guest limit ----
def test_new_card_free_and_slug(card):
    assert card["plan"] == "free"
    assert card["slug"] == "daawat-rsvp"


def test_three_at_once_402(card):
    r = add(card["card_id"], ["TEST_A", "TEST_B", "TEST_C"])
    assert r.status_code == 402
    assert "Free cards can be sent to 2 people" in r.json()["detail"]
    assert db.guests.count_documents({"card_id": card["card_id"]}) == 0  # atomic: nothing inserted


def test_two_ok_third_402(card):
    r = add(card["card_id"], ["TEST_A", "TEST_B"])
    assert r.status_code == 200 and r.json()["added"] == 2
    r = add(card["card_id"], ["TEST_C"])
    assert r.status_code == 402


def test_billing_card_info(card):
    d = requests.get(f"{API}/billing/cards/{card['card_id']}", headers=HOST).json()
    assert d["plan"] == "free" and d["limit"] == 2 and d["used"] == 2 and d["mode"] == "mock"
    assert d["price"]["base"] == 9900 and d["price"]["gst"] == 1782 and d["price"]["total"] == 11682


def test_public_watermark_and_og(card):
    d = requests.get(f"{API}/public/cards/daawat-rsvp").json()
    assert d["watermark"] is True
    assert "owner_id" not in d and "grant" not in d
    r = requests.get(f"{API}/og/daawat-rsvp/e1.png")
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/png")


# ---- Admin grant/revoke card ----
def test_admin_grant_revoke_card(card):
    cid = card["card_id"]
    assert requests.post(f"{API}/admin/cards/{cid}/grant", json={"note": "", "until": ""}, headers=ADMIN).status_code == 422
    r = requests.post(f"{API}/admin/cards/{cid}/grant", json={"note": "family", "until": ""}, headers=ADMIN)
    assert r.status_code == 200
    assert requests.get(f"{API}/public/cards/daawat-rsvp").json()["watermark"] is False
    assert add(cid, ["TEST_C"]).status_code == 200
    b = requests.get(f"{API}/billing/cards/{cid}", headers=HOST).json()
    assert b["plan"] == "paid_without_payment" and b["limit"] is None
    audit = requests.get(f"{API}/admin/audit", headers=ADMIN).json()
    assert any(a["action"] == "grant_card" and a["target"] == cid for a in audit)
    assert requests.post(f"{API}/admin/cards/{cid}/revoke", headers=ADMIN).status_code == 200
    assert requests.get(f"{API}/public/cards/daawat-rsvp").json()["watermark"] is True
    assert add(cid, ["TEST_D"]).status_code == 402


def test_expired_grant_public_watermark(card):
    """Card grant with past end date should behave as free everywhere (incl. public card)."""
    cid = card["card_id"]
    requests.post(f"{API}/admin/cards/{cid}/grant", json={"note": "expired", "until": "2020-01-01"}, headers=ADMIN)
    b = requests.get(f"{API}/billing/cards/{cid}", headers=HOST).json()
    pub = requests.get(f"{API}/public/cards/daawat-rsvp").json()
    requests.post(f"{API}/admin/cards/{cid}/revoke", headers=ADMIN)
    assert b["plan"] == "free"
    assert pub["watermark"] is True, "public card ignores expired grant (grant projected out in public_card)"


# ---- Account grant ----
def test_account_grant(card):
    r = requests.post(f"{API}/admin/users/test-host-1/grant", json={"note": "TEST vip", "until": ""}, headers=ADMIN)
    assert r.status_code == 200
    try:
        assert requests.get(f"{API}/public/cards/daawat-rsvp").json()["watermark"] is False
        c2 = new_card(primary="TEST_Acct", secondary="Grant", status="draft")
        lst = {c["card_id"]: c for c in requests.get(f"{API}/cards", headers=HOST).json()}
        assert lst[c2["card_id"]]["plan"] == "paid_without_payment"
        assert add(c2["card_id"], ["TEST_1", "TEST_2", "TEST_3"]).status_code == 200
        db.cards.delete_one({"card_id": c2["card_id"]}); db.guests.delete_many({"card_id": c2["card_id"]})
    finally:
        assert requests.post(f"{API}/admin/users/test-host-1/revoke", headers=ADMIN).status_code == 200
    assert requests.get(f"{API}/public/cards/daawat-rsvp").json()["watermark"] is True
    assert requests.post(f"{API}/admin/users/nouser_x/grant", json={"note": "xx"}, headers=ADMIN).status_code == 404


# ---- Payment ----
def test_order_requires_terms(card):
    r = requests.post(f"{API}/billing/cards/{card['card_id']}/order", json={"agreed_terms": False}, headers=HOST)
    assert r.status_code == 422


def test_failure_path(card):
    o = requests.post(f"{API}/billing/cards/{card['card_id']}/order", json={"agreed_terms": True}, headers=HOST).json()
    assert o["order_id"].startswith("order_mock_") and o["amount"] == 11682
    r = requests.post(f"{API}/billing/mock/{o['order_id']}/failure", headers=HOST)
    assert r.json()["status"] == "failed"
    assert requests.get(f"{API}/billing/payments/{o['order_id']}", headers=HOST).json()["status"] == "failed"
    assert requests.get(f"{API}/billing/payments/{o['order_id']}/invoice.pdf", headers=HOST).status_code == 409


def test_wrong_signature_400(card):
    o, s = pay_mock(card["card_id"])
    s["razorpay_signature"] = "deadbeef"
    assert requests.post(f"{API}/billing/verify", json=s, headers=HOST).status_code == 400


def test_payment_success_flow(card):
    o, s = pay_mock(card["card_id"])
    assert all(k in s for k in ("razorpay_order_id", "razorpay_payment_id", "razorpay_signature"))
    r = requests.post(f"{API}/billing/verify", json=s, headers=HOST)
    assert r.status_code == 200
    p = r.json()
    assert p["status"] == "captured" and p["mode"] == "mock"
    import re
    assert re.match(r"^DW-\d{4}-\d{5}$", p["invoice_no"])
    # idempotent re-verify
    assert requests.post(f"{API}/billing/verify", json=s, headers=HOST).json()["invoice_no"] == p["invoice_no"]
    assert requests.get(f"{API}/billing/cards/{card['card_id']}", headers=HOST).json()["plan"] == "paid"
    assert requests.get(f"{API}/public/cards/daawat-rsvp").json()["watermark"] is False
    pdf = requests.get(f"{API}/billing/payments/{o['order_id']}/invoice.pdf", headers=HOST)
    assert pdf.status_code == 200 and pdf.headers["content-type"] == "application/pdf" and pdf.content[:4] == b"%PDF"
    # 2nd order on paid card -> 409
    assert requests.post(f"{API}/billing/cards/{card['card_id']}/order", json={"agreed_terms": True}, headers=HOST).status_code == 409
    # revenue: mock excluded, include_mock lists it
    rev = requests.get(f"{API}/admin/revenue", headers=ADMIN).json()
    assert all(x["mode"] != "mock" for x in rev["payments"])
    revm = requests.get(f"{API}/admin/revenue?include_mock=true", headers=ADMIN).json()
    assert any(x["order_id"] == o["order_id"] for x in revm["payments"])
    assert revm["totals"] == rev["totals"]
    csv = requests.get(f"{API}/admin/revenue.csv?include_mock=true", headers=ADMIN)
    assert csv.status_code == 200 and "text/csv" in csv.headers["content-type"] and o["order_id"] in csv.text


# ---- Webhook ----
def test_webhook():
    c = new_card(primary="TEST_Hook", secondary="Card", status="draft")
    try:
        o = requests.post(f"{API}/billing/cards/{c['card_id']}/order", json={"agreed_terms": True}, headers=HOST).json()
        body = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_TEST_1", "order_id": o["order_id"], "amount": o["amount"], "currency": "INR"}}}}).encode()
        bad = requests.post(f"{API}/webhooks/razorpay", data=body, headers={"X-Razorpay-Signature": "bad", "Content-Type": "application/json"})
        assert bad.status_code == 400
        sig = hmac.new(b"mock_webhook_secret", body, hashlib.sha256).hexdigest()
        h = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
        assert requests.post(f"{API}/webhooks/razorpay", data=body, headers=h).status_code == 200
        p1 = requests.get(f"{API}/billing/payments/{o['order_id']}", headers=HOST).json()
        assert p1["status"] == "captured" and p1["captured_by"] == "webhook"
        assert requests.get(f"{API}/billing/cards/{c['card_id']}", headers=HOST).json()["plan"] == "paid"
        assert requests.post(f"{API}/webhooks/razorpay", data=body, headers=h).status_code == 200
        p2 = requests.get(f"{API}/billing/payments/{o['order_id']}", headers=HOST).json()
        assert p2["invoice_no"] == p1["invoice_no"]
    finally:
        db.cards.delete_one({"card_id": c["card_id"]})


# ---- Admin endpoints ----
@pytest.mark.parametrize("path", ["/admin/overview", "/admin/users?q=test", "/admin/cards?plan=free", "/admin/free-events",
                                  "/admin/revenue", "/admin/revenue.csv", "/admin/audit", "/admin/callbacks"])
def test_admin_access(path):
    assert requests.get(f"{API}{path}", headers=ADMIN).status_code == 200
    assert requests.get(f"{API}{path}", headers=HOST).status_code == 403


def test_admin_data_shapes(card):
    ov = requests.get(f"{API}/admin/overview", headers=ADMIN).json()
    assert set(ov["categories"]) == {"free", "paid", "paid_without_payment"} and len(ov["new_users"]) == 30
    us = requests.get(f"{API}/admin/users?q=test.host", headers=ADMIN).json()
    assert any(u["user_id"] == "test-host-1" for u in us)
    cards = requests.get(f"{API}/admin/cards?plan=free", headers=ADMIN).json()
    assert all(c["plan"] == "free" for c in cards)
    fe = requests.get(f"{API}/admin/free-events", headers=ADMIN).json()
    assert all("days_left" in e and "next_date" in e for e in fe)


def test_disable_card(card):
    cid = card["card_id"]
    assert requests.patch(f"{API}/admin/cards/{cid}", json={"disabled": True}, headers=ADMIN).status_code == 200
    assert requests.get(f"{API}/public/cards/daawat-rsvp").status_code == 404
    requests.patch(f"{API}/admin/cards/{cid}", json={"disabled": False}, headers=ADMIN)
    assert requests.get(f"{API}/public/cards/daawat-rsvp").status_code == 200


def test_callback_status():
    rid = f"TEST_{uuid.uuid4().hex[:8]}"
    db.callbacks.insert_one({"request_id": rid, "name": "TEST", "mobile": "9999999999", "created_at": "2026-01-01", "status": "new"})
    try:
        r = requests.patch(f"{API}/admin/callbacks/{rid}", json={"status": "called", "notes": "x"}, headers=ADMIN)
        assert r.status_code == 200
        doc = db.callbacks.find_one({"request_id": rid})
        assert doc["status"] == "called" and doc["notes"] == "x"
    finally:
        db.callbacks.delete_one({"request_id": rid})


def test_settings_guest_limit():
    s = requests.get(f"{API}/admin/settings", headers=ADMIN)
    assert s.status_code == 200
    cur = s.json()
    c = new_card(primary="TEST_Limit", secondary="Three", status="draft")
    try:
        r = requests.put(f"{API}/admin/settings", json={**cur, "free_guest_limit": 3}, headers=ADMIN)
        assert r.status_code == 200, r.text
        assert add(c["card_id"], ["TEST_1", "TEST_2", "TEST_3"]).status_code == 200
        assert add(c["card_id"], ["TEST_4"]).status_code == 402
    finally:
        requests.put(f"{API}/admin/settings", json={**cur, "free_guest_limit": 2}, headers=ADMIN)
        db.cards.delete_one({"card_id": c["card_id"]}); db.guests.delete_many({"card_id": c["card_id"]})
    assert requests.get(f"{API}/billing/config").json()["free_guest_limit"] == 2
