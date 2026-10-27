# Daawat iteration 4: invite template, bulk merge, bulk delete/rename, sent/undo, owner-only
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _login():
    s = requests.Session()
    phone = "96" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_Host"})
    assert r.status_code == 200, r.text
    return s


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "Tst", "secondary_name": "Two",
         "title": "TEST Send", "status": "published", "music_track": "none",
         "events": [{"name": "Mehndi", "date": "2026-12-01", "time": "18:00"}]}
    p.update(kw)
    return p


@pytest.fixture(scope="module")
def ctx():
    s = _login()
    other = _login()
    c = s.post(f"{API}/cards", json=_payload()).json()
    yield s, other, c
    s.delete(f"{API}/cards/{c['card_id']}")


# ---- Invite template ----
class TestInviteTemplate:
    def test_set_and_get(self, ctx):
        s, _, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}/invite-template", json={"template": "  Hi {guest}, {link}  "})
        assert r.status_code == 200, r.text
        assert r.json()["invite_template"] == "Hi {guest}, {link}"
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert g["invite_template"] == "Hi {guest}, {link}"

    def test_wizard_save_keeps_template(self, ctx):
        s, _, c = ctx
        s.put(f"{API}/cards/{c['card_id']}/invite-template", json={"template": "Keep me {guest}"})
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(title="TEST Send 2", invite_template="WIPE"))
        assert r.status_code == 200, r.text
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert g["title"] == "TEST Send 2"
        assert g["invite_template"] == "Keep me {guest}"

    def test_owner_only(self, ctx):
        _, other, c = ctx
        r = other.put(f"{API}/cards/{c['card_id']}/invite-template", json={"template": "x"})
        assert r.status_code in (403, 404)

    def test_too_long(self, ctx):
        s, _, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}/invite-template", json={"template": "x" * 2001})
        assert r.status_code == 422


# ---- Bulk add merge / skip ----
class TestBulkMerge:
    def test_skip_then_merge(self, ctx):
        s, _, c = ctx
        cid = c["card_id"]
        r = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [
            {"name": "TEST Alpha", "phone": "9811111111"}, {"name": "TEST Beta", "phone": "+91 98222 22222"}]})
        assert r.status_code == 200 and r.json()["added"] == 2
        r = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [
            {"name": "TEST Alpha2", "phone": "09811111111"}], "on_duplicate": "skip"})
        d = r.json()
        assert d["added"] == 0 and d["skipped"] == 1 and d["merged"] == 0
        r = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [
            {"name": "TEST Alpha Merged", "phone": "+919811111111"}, {"name": "TEST Gamma", "phone": "9833333333"}],
            "on_duplicate": "merge"})
        d = r.json()
        assert d["added"] == 1 and d["merged"] == 1, d
        names = {g["phone"]: g["name"] for g in s.get(f"{API}/cards/{cid}/guests").json()}
        assert names["+919811111111"] == "TEST Alpha Merged"
        assert len([p for p in names if p == "+919811111111"]) == 1

    def test_invalid_on_duplicate(self, ctx):
        s, _, c = ctx
        r = s.post(f"{API}/cards/{c['card_id']}/guests/bulk",
                   json={"guests": [{"name": "X", "phone": ""}], "on_duplicate": "bogus"})
        assert r.status_code == 422


# ---- Bulk delete / rename / sent / undo ----
class TestBulkOps:
    def test_rename_sent_undo_delete(self, ctx):
        s, other, c = ctx
        cid = c["card_id"]
        added = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [
            {"name": "TEST d1", "phone": "9844444441"}, {"name": "TEST d2", "phone": "9844444442"}]}).json()["guests"]
        ids = [g["guest_id"] for g in added]
        # rename
        r = s.post(f"{API}/cards/{cid}/guests/bulk-rename",
                   json={"guests": [{"guest_id": ids[0], "name": "  TEST   Renamed  "}]})
        assert r.status_code == 200
        assert any(g["guest_id"] == ids[0] and g["name"] == "TEST Renamed" for g in r.json())
        # sent
        r = s.post(f"{API}/cards/{cid}/guests/{ids[0]}/sent")
        assert r.status_code == 200 and r.json()["sent_at"]
        r = s.delete(f"{API}/cards/{cid}/guests/{ids[0]}/sent")
        assert r.status_code == 200 and r.json()["sent_at"] is None
        assert s.delete(f"{API}/cards/{cid}/guests/nope/sent").status_code == 404
        # owner-only
        assert other.post(f"{API}/cards/{cid}/guests/{ids[0]}/sent").status_code in (403, 404)
        assert other.delete(f"{API}/cards/{cid}/guests/{ids[0]}/sent").status_code in (403, 404)
        assert other.post(f"{API}/cards/{cid}/guests/bulk-delete", json={"guest_ids": ids}).status_code in (403, 404)
        assert other.post(f"{API}/cards/{cid}/guests/bulk-rename",
                          json={"guests": [{"guest_id": ids[0], "name": "hack"}]}).status_code in (403, 404)
        assert requests.post(f"{API}/cards/{cid}/guests/bulk-delete", json={"guest_ids": ids}).status_code == 401
        # bulk delete
        r = s.post(f"{API}/cards/{cid}/guests/bulk-delete", json={"guest_ids": ids})
        assert r.status_code == 200 and r.json()["deleted"] == 2
        left = {g["guest_id"] for g in s.get(f"{API}/cards/{cid}/guests").json()}
        assert not left & set(ids)

    def test_bulk_delete_empty(self, ctx):
        s, _, c = ctx
        assert s.post(f"{API}/cards/{c['card_id']}/guests/bulk-delete", json={"guest_ids": []}).status_code == 422
