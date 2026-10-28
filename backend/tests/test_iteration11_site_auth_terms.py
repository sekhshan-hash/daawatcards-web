# Iteration 11: Google-only auth, site settings/legal pages, call-back support, terms-before-publish.
import os
import random
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
HOST = {"Authorization": "Bearer test_session_host"}
ADMIN = {"Authorization": "Bearer test_session_admin"}


def _mobile():
    return str(random.choice([6, 7, 8, 9])) + str(random.randint(10 ** 8, 10 ** 9 - 1))


def _cb(mobile, **kw):
    p = {"name": "TEST_Caller", "mobile": mobile, "time": "evening", "message": "TEST msg", "website": "", "elapsed_ms": 5000}
    p.update(kw)
    # random X-Forwarded-For so the per-IP limit (10/day) does not interfere with test runs
    ip = f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
    return requests.post(f"{API}/support/callback", json=p, headers={"X-Forwarded-For": ip})


def _card(**kw):
    p = {"event_type": "birthday", "template": "birthday-playful", "primary_name": "TEST_Terms", "secondary_name": "",
         "language": "en", "status": "draft",
         "events": [{"event_id": "e1", "name": "Party", "date": "2026-12-01", "time": "18:00", "venue_name": "TEST Hall"}]}
    p.update(kw)
    return p


# --- Auth (Google only) ---
class TestAuth:
    def test_otp_request_removed(self):
        assert requests.post(f"{API}/auth/otp/request", json={"phone": "9876543210"}, headers={"X-No-Shim": "1"}).status_code == 404

    def test_otp_verify_removed(self):
        assert requests.post(f"{API}/auth/otp/verify", json={"phone": "9876543210", "code": "123456"}, headers={"X-No-Shim": "1"}).status_code == 404

    def test_me_host(self):
        r = requests.get(f"{API}/auth/me", headers=HOST)
        assert r.status_code == 200
        u = r.json()
        assert "_id" not in u and u["email"] == "test.host@example.com"
        assert "name" in u and "picture" in u and u.get("is_admin") is False

    def test_me_admin(self):
        r = requests.get(f"{API}/auth/me", headers=ADMIN)
        assert r.status_code == 200 and r.json()["is_admin"] is True

    def test_me_unauth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401


# --- Site settings + legal pages ---
class TestSite:
    def test_site_public(self):
        r = requests.get(f"{API}/site")
        assert r.status_code == 200
        d = r.json()
        for k in ("company", "address", "email", "hours", "updated"):
            assert k in d
        for p in ("terms", "privacy", "refund", "pricing"):
            assert d["pages"][p]
        assert "{company}" not in d["pages"]["terms"] and "{email}" not in d["pages"]["privacy"]
        assert d["company"] in d["pages"]["terms"]
        assert d["pages"]["terms"].startswith("1. About us")

    def test_settings_forbidden_for_host(self):
        assert requests.get(f"{API}/admin/settings", headers=HOST).status_code == 403
        assert requests.put(f"{API}/admin/settings", headers=HOST, json={}).status_code in (403, 422)

    def test_settings_put_persists_and_restore(self):
        r = requests.get(f"{API}/admin/settings", headers=ADMIN)
        assert r.status_code == 200
        orig = r.json()
        assert "{address}" in orig["terms"]
        new = {**orig, "address": "TEST_Address 42, Lucknow"}
        try:
            r = requests.put(f"{API}/admin/settings", headers=ADMIN, json=new)
            assert r.status_code == 200 and r.json()["address"] == "TEST_Address 42, Lucknow"
            s = requests.get(f"{API}/site").json()
            assert s["address"] == "TEST_Address 42, Lucknow"
            assert "TEST_Address 42, Lucknow" in s["pages"]["terms"]
        finally:
            requests.put(f"{API}/admin/settings", headers=ADMIN, json=orig)
        assert requests.get(f"{API}/site").json()["address"] == orig["address"]

    def test_settings_put_invalid_email(self):
        orig = requests.get(f"{API}/admin/settings", headers=ADMIN).json()
        assert requests.put(f"{API}/admin/settings", headers=ADMIN, json={**orig, "email": "bad"}).status_code == 422


# --- Call-back requests ---
class TestCallback:
    @classmethod
    def teardown_class(cls):
        from conftest import _db
        _db.callbacks.delete_many({"name": "TEST_Caller"})

    def test_valid_saved_and_listed_then_done(self):
        m = _mobile()
        r = _cb(m)
        assert r.status_code == 200 and r.json()["ok"] is True
        lst = requests.get(f"{API}/admin/callbacks", headers=ADMIN)
        assert lst.status_code == 200
        mine = [c for c in lst.json() if c["mobile"] == f"+91{m}"]
        assert len(mine) == 1 and mine[0]["status"] == "new" and mine[0]["time"] == "evening"
        assert "_id" not in mine[0] and "ip" not in mine[0]
        rid = mine[0]["request_id"]
        p = requests.patch(f"{API}/admin/callbacks/{rid}", headers=ADMIN, json={"status": "done"})
        assert p.status_code == 200
        again = [c for c in requests.get(f"{API}/admin/callbacks", headers=ADMIN).json() if c["request_id"] == rid]
        assert again[0]["status"] == "done"

    def test_list_forbidden_host(self):
        assert requests.get(f"{API}/admin/callbacks", headers=HOST).status_code == 403

    def test_patch_unknown(self):
        assert requests.patch(f"{API}/admin/callbacks/nope", headers=ADMIN, json={"status": "done"}).status_code == 404

    @pytest.mark.parametrize("bad", ["12345", "5123456789", "98765432101", "abcdefghij"])
    def test_invalid_mobile(self, bad):
        assert _cb(bad).status_code == 422

    def test_prefixed_number_normalised(self):
        m = _mobile()
        assert _cb(f"+91 {m[:5]} {m[5:]}").status_code == 200
        assert any(c["mobile"] == f"+91{m}" for c in requests.get(f"{API}/admin/callbacks", headers=ADMIN).json())

    def test_rate_limit_4th(self):
        m = _mobile()
        for _ in range(3):
            assert _cb(m).status_code == 200
        r = _cb(m)
        assert r.status_code == 429

    def test_honeypot_not_saved(self):
        m = _mobile()
        r = _cb(m, website="http://spam")
        assert r.status_code == 200 and r.json()["ok"] is True
        assert not any(c["mobile"] == f"+91{m}" for c in requests.get(f"{API}/admin/callbacks", headers=ADMIN).json())

    def test_too_fast_not_saved(self):
        m = _mobile()
        r = _cb(m, elapsed_ms=1000)
        assert r.status_code == 200
        assert not any(c["mobile"] == f"+91{m}" for c in requests.get(f"{API}/admin/callbacks", headers=ADMIN).json())

    def test_bad_time(self):
        assert _cb(_mobile(), time="night").status_code == 422


# --- Terms before publish ---
class TestTerms:
    created = []

    @classmethod
    def teardown_class(cls):
        for cid in cls.created:
            requests.delete(f"{API}/cards/{cid}", headers=HOST)

    def test_post_published_without_terms(self):
        r = requests.post(f"{API}/cards", headers=HOST, json=_card(status="published", agreed_terms=False))
        assert r.status_code == 422

    def test_post_published_missing_terms(self):
        r = requests.post(f"{API}/cards", headers={**HOST, "X-No-Shim": "1"}, json=_card(status="published"))
        assert r.status_code == 422

    def test_post_published_with_terms(self):
        r = requests.post(f"{API}/cards", headers=HOST, json=_card(status="published", agreed_terms=True))
        assert r.status_code == 200 and r.json()["status"] == "published"
        self.created.append(r.json()["card_id"])

    def test_draft_then_put_publish(self):
        r = requests.post(f"{API}/cards", headers=HOST, json=_card())
        assert r.status_code == 200
        c = r.json()
        self.created.append(c["card_id"])
        r = requests.put(f"{API}/cards/{c['card_id']}", headers=HOST, json=_card(status="published", agreed_terms=False))
        assert r.status_code == 422
        r = requests.put(f"{API}/cards/{c['card_id']}", headers=HOST, json=_card(status="published", agreed_terms=True))
        assert r.status_code == 200
        assert requests.get(f"{API}/cards/{c['card_id']}", headers=HOST).json()["status"] == "published"

    def test_carddetail_style_publish_of_draft(self):
        # CardDetail.jsx publishes with {...card, status:'published'} (card from GET has agreed_terms false)
        c = requests.post(f"{API}/cards", headers=HOST, json=_card()).json()
        self.created.append(c["card_id"])
        full = requests.get(f"{API}/cards/{c['card_id']}", headers=HOST).json()
        r = requests.put(f"{API}/cards/{c['card_id']}", headers=HOST, json={**full, "status": "published"})
        assert r.status_code == 200, f"CardDetail publish path rejected: {r.status_code} {r.text}"
