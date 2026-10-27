# Daawat invitation API regression tests: auth (mock OTP), cards CRUD, public guest endpoints, share/OG/ICS
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _phone():
    return "98" + str(uuid.uuid4().int)[:8]


def _login(phone=None):
    s = requests.Session()
    phone = phone or _phone()
    r = s.post(f"{API}/auth/otp/request", json={"phone": phone})
    assert r.status_code == 200, r.text
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_Host"})
    assert r.status_code == 200, r.text
    return s, r.json()


def _card_payload(**kw):
    p = {
        "event_type": "wedding", "template": "wedding-royal", "primary_name": "Sara", "secondary_name": "Omar",
        "host_family": "TEST_Family", "title": "TEST Wedding", "music_track": "royal-raag", "status": "published",
        "events": [
            {"name": "Mehndi", "date": "2026-12-01", "time": "18:00", "venue_name": "Hall A"},
            {"name": "Nikah", "date": "2026-12-02", "time": "19:00", "venue_name": "Hall B"},
        ],
    }
    p.update(kw)
    return p


@pytest.fixture(scope="module")
def host():
    s, user = _login()
    created = []
    yield s, user, created
    for cid in created:
        s.delete(f"{API}/cards/{cid}")


# ---- Auth ----
class TestAuth:
    def test_otp_request_mock(self):
        r = requests.post(f"{API}/auth/otp/request", json={"phone": "9876543210"})
        assert r.status_code == 200
        d = r.json()
        assert d["dev_code"] == "123456" and d["mocked"] is True and d["phone"] == "+919876543210"

    def test_otp_invalid_phone(self):
        r = requests.post(f"{API}/auth/otp/request", json={"phone": "12"})
        assert r.status_code == 422

    def test_otp_wrong_code(self):
        ph = _phone()
        requests.post(f"{API}/auth/otp/request", json={"phone": ph})
        r = requests.post(f"{API}/auth/otp/verify", json={"phone": ph, "code": "000000"})
        assert r.status_code == 400

    def test_verify_cookie_me_bearer_logout(self):
        s, user = _login()
        assert user["auth_provider"] == "phone" and "_id" not in user
        token = s.cookies.get("session_token")
        assert token
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200 and r.json()["user_id"] == user["user_id"]
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200 and r.json()["user_id"] == user["user_id"]
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 401

    def test_me_unauth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401


# ---- Cards CRUD ----
class TestCards:
    def test_create_slug_event_ids_and_get(self, host):
        s, _, created = host
        r1 = s.post(f"{API}/cards", json=_card_payload())
        assert r1.status_code == 200, r1.text
        c1 = r1.json(); created.append(c1["card_id"])
        assert c1["slug"].startswith("sara-omar")
        assert [e["event_id"] for e in c1["events"]] == ["e1", "e2"]
        r2 = s.post(f"{API}/cards", json=_card_payload())
        c2 = r2.json(); created.append(c2["card_id"])
        assert c2["slug"] != c1["slug"] and c2["slug"].startswith("sara-omar-")
        g = s.get(f"{API}/cards/{c1['card_id']}")
        assert g.status_code == 200 and g.json()["primary_name"] == "Sara"
        lst = s.get(f"{API}/cards").json()
        assert any(c["card_id"] == c1["card_id"] for c in lst)
        assert all("stats" in c for c in lst)

    def test_validation(self, host):
        s, _, _ = host
        p = _card_payload(); p.pop("primary_name")
        assert s.post(f"{API}/cards", json=p).status_code == 422
        p = _card_payload(); p["events"][0]["date"] = "12/01/2026"
        assert s.post(f"{API}/cards", json=p).status_code == 422
        assert s.post(f"{API}/cards", json=_card_payload(template="nope")).status_code == 422
        assert s.post(f"{API}/cards", json=_card_payload(primary_name="")).status_code == 422

    def test_owner_scoping(self, host):
        s, _, created = host
        cid = s.post(f"{API}/cards", json=_card_payload()).json()["card_id"]; created.append(cid)
        other, _ = _login()
        assert other.get(f"{API}/cards/{cid}").status_code == 404
        assert other.put(f"{API}/cards/{cid}", json=_card_payload()).status_code == 404
        assert other.delete(f"{API}/cards/{cid}").status_code == 404
        assert requests.get(f"{API}/cards").status_code == 401

    def test_update_and_public_reflects(self, host):
        s, _, created = host
        c = s.post(f"{API}/cards", json=_card_payload()).json(); created.append(c["card_id"])
        p = _card_payload(title="TEST Updated Title", events=c["events"] + [{"name": "Walima", "date": "2026-12-03", "time": "20:00"}])
        r = s.put(f"{API}/cards/{c['card_id']}", json=p)
        assert r.status_code == 200
        d = r.json()
        assert d["title"] == "TEST Updated Title" and d["slug"] == c["slug"]
        assert [e["event_id"] for e in d["events"]] == ["e1", "e2", "e3"]
        pub = requests.get(f"{API}/public/cards/{c['slug']}")
        assert pub.status_code == 200 and pub.json()["title"] == "TEST Updated Title"
        assert "owner_id" not in pub.json()

    def test_draft_404_public_and_delete(self, host):
        s, _, _ = host
        c = s.post(f"{API}/cards", json=_card_payload(status="draft")).json()
        assert requests.get(f"{API}/public/cards/{c['slug']}").status_code == 404
        assert requests.post(f"{API}/public/cards/{c['slug']}/wishes", json={"guest_name": "X", "message": "hi"}).status_code == 404
        assert s.delete(f"{API}/cards/{c['card_id']}").status_code == 200
        assert s.get(f"{API}/cards/{c['card_id']}").status_code == 404


# ---- Public demo / share ----
class TestPublic:
    def test_demo_card(self):
        r = requests.get(f"{API}/public/cards/aftab-hifza")
        assert r.status_code == 200
        d = r.json()
        assert len(d["events"]) == 4 and d["primary_name"] == "Aftab" and "_id" not in d
        assert requests.get(f"{API}/public/cards/zara-turns-7").status_code == 200
        assert requests.get(f"{API}/public/cards/nope").status_code == 404

    def test_ics(self):
        r = requests.get(f"{API}/public/cards/aftab-hifza/events/e3/ics")
        assert r.status_code == 200 and r.headers["content-type"].startswith("text/calendar")
        assert "BEGIN:VCALENDAR" in r.text and "DTSTART:20261212T133000Z" in r.text and "Nikah" in r.text

    def test_og_png(self):
        r = requests.get(f"{API}/og/aftab-hifza/e2.png")
        assert r.status_code == 200 and r.headers["content-type"] == "image/png"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_share_page(self):
        r = requests.get(f"{API}/s/aftab-hifza/e2", params={"to": "Ali Khan"}, allow_redirects=False)
        assert r.status_code == 200 and "text/html" in r.headers["content-type"]
        t = r.text
        assert 'property="og:title"' in t and "Ali Khan" in t
        assert 'property="og:description"' in t and 'property="og:image"' in t
        assert "/api/og/aftab-hifza/e2.png" in t
        assert "/i/aftab-hifza/e2?to=Ali+Khan" in t

    def test_share_xss_escape(self):
        r = requests.get(f"{API}/s/aftab-hifza/e1", params={"to": "</script><script>alert(1)</script>"})
        assert r.status_code == 200
        assert "<script>alert(1)" not in r.text
