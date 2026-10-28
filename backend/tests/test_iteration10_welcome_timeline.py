# Daawat iteration 10: welcome_text + timeline_art fields on cards (CardIn), public exposure, validation
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
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_It10"})
    assert r.status_code == 200, r.text
    return s


EVS = [{"event_id": "e1", "name": "Mehndi", "date": "2025-06-01", "time": "18:00", "venue_name": "TEST Old Hall"},
       {"event_id": "e2", "name": "Nikah", "date": "2026-12-01", "time": "13:00", "venue_name": "TEST Hall"}]


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "TEST Amir", "secondary_name": "Sara",
         "title": "TEST It10", "status": "published", "music_track": "none", "events": EVS,
         "welcome_text": "TEST Welcome dear guest", "timeline_art": False}
    p.update(kw)
    return p


@pytest.fixture(scope="module")
def ctx():
    s = _login()
    r = s.post(f"{API}/cards", json=_payload())
    assert r.status_code in (200, 201), r.text
    c = r.json()
    yield s, c
    s.delete(f"{API}/cards/{c['card_id']}")


class TestWelcomeTimeline:
    def test_create_persisted(self, ctx):
        s, c = ctx
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        assert d["welcome_text"] == "TEST Welcome dear guest"
        assert d["timeline_art"] is False

    def test_public_has_fields(self, ctx):
        _, c = ctx
        p = requests.get(f"{API}/public/cards/{c['slug']}").json()
        assert p["welcome_text"] == "TEST Welcome dear guest"
        assert p["timeline_art"] is False

    def test_put_update(self, ctx):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(welcome_text="", timeline_art=True))
        assert r.status_code == 200, r.text
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        assert d["welcome_text"] == "" and d["timeline_art"] is True

    def test_defaults(self):
        s = _login()
        p = _payload()
        p.pop("welcome_text")
        p.pop("timeline_art")
        r = s.post(f"{API}/cards", json=p)
        assert r.status_code in (200, 201), r.text
        c = r.json()
        try:
            d = s.get(f"{API}/cards/{c['card_id']}").json()
            assert d["welcome_text"] == "" and d["timeline_art"] is True
        finally:
            s.delete(f"{API}/cards/{c['card_id']}")

    def test_welcome_max_400(self, ctx):
        s, _ = ctx
        assert s.post(f"{API}/cards", json=_payload(welcome_text="x" * 401)).status_code == 422
        r = s.post(f"{API}/cards", json=_payload(welcome_text="y" * 400))
        assert r.status_code in (200, 201)
        s.delete(f"{API}/cards/{r.json()['card_id']}")

    def test_timeline_art_bad_type(self, ctx):
        s, _ = ctx
        assert s.post(f"{API}/cards", json=_payload(timeline_art="notabool")).status_code == 422

    def test_demo_public(self):
        p = requests.get(f"{API}/public/cards/demo-shahnawaz-farah").json()
        assert [e["name"] for e in p["events"]][:4] == ["Haldi", "Baraat", "Nikah", "Walima"] or len(p["events"]) == 4
        assert p.get("timeline_art", True) is not False
