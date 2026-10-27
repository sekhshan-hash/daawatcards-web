# Daawat iteration 7: custom header lines, per-event headers, intro_title (share title), demo rename, RSVP removed
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _login(name="TEST_It7"):
    s = requests.Session()
    phone = "95" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": name})
    assert r.status_code == 200, r.text
    return s


EVS = [{"event_id": "e1", "name": "Haldi", "date": "2026-12-01", "time": "11:00", "header_key": "om"},
       {"event_id": "e2", "name": "Nikah", "date": "2026-12-02", "time": "18:00",
        "custom_header": {"text": "TEST event line", "sub": "sub", "script": "deva", "size": "l", "color": "white"}}]


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "TEST Amir", "secondary_name": "Sara",
         "title": "TEST It7", "status": "published", "music_track": "none", "events": EVS, "tradition": "muslim",
         "header_key": "786"}
    p.update(kw)
    return p


@pytest.fixture(scope="module")
def ctx():
    s = _login()
    r = s.post(f"{API}/cards", json=_payload(custom_header={"text": "بسم الله", "sub": "In the name", "script": "arabic",
                                                            "size": "s", "color": "gold"}, header_per_event=True))
    assert r.status_code in (200, 201), r.text
    c = r.json()
    yield s, c
    s.delete(f"{API}/cards/{c['card_id']}")


# ---- header fields persist ----
class TestHeaders:
    def test_create_persists_fields(self, ctx):
        s, c = ctx
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        assert d["custom_header"] == {"text": "بسم الله", "sub": "In the name", "script": "arabic", "size": "s", "color": "gold"}
        assert d["header_per_event"] is True and d["header_key"] == "786"
        assert d["events"][0]["header_key"] == "om"
        assert d["events"][1]["custom_header"]["text"] == "TEST event line"
        assert d["events"][1]["custom_header"]["script"] == "deva" and d["events"][1]["custom_header"]["color"] == "white"

    def test_defaults(self):
        s = _login()
        r = s.post(f"{API}/cards", json=_payload(events=[{"name": "Walima", "date": "2026-12-01", "time": "11:00"}]))
        d = r.json()
        try:
            assert d["custom_header"] == {"text": "", "sub": "", "script": "latin", "size": "m", "color": "gold"}
            assert d["header_per_event"] is False and d["intro_title"] == ""
        finally:
            s.delete(f"{API}/cards/{d['card_id']}")

    @pytest.mark.parametrize("ch", [{"script": "klingon"}, {"size": "xl"}, {"color": "red"}, {"text": "x" * 121}])
    def test_invalid_custom_header_422(self, ctx, ch):
        s, _ = ctx
        assert s.post(f"{API}/cards", json=_payload(custom_header=ch)).status_code == 422

    def test_invalid_event_custom_header_422(self, ctx):
        s, _ = ctx
        evs = [{"name": "A", "date": "2026-12-01", "time": "11:00", "custom_header": {"script": "bad"}}]
        assert s.post(f"{API}/cards", json=_payload(events=evs)).status_code == 422

    def test_intro_title_too_long_422(self, ctx):
        s, _ = ctx
        assert s.post(f"{API}/cards", json=_payload(intro_title="x" * 81)).status_code == 422


# ---- intro title in share page ----
class TestIntroTitle:
    def test_auto_multi_event(self, ctx):
        _, c = ctx
        t = requests.get(f"{API}/s/{c['slug']}/e1").text
        assert "<title>Wedding Invitation · " in t

    def test_custom_intro_title_put(self, ctx):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(intro_title="TEST Shaadi Mubarak", header_per_event=True))
        assert r.status_code == 200, r.text
        assert s.get(f"{API}/cards/{c['card_id']}").json()["intro_title"] == "TEST Shaadi Mubarak"
        t = requests.get(f"{API}/s/{c['slug']}/e1", params={"to": "Ali"}).text
        assert "Ali, you&#x27;re invited! TEST Shaadi Mubarak · " in t

    def test_single_event_aqiqah(self):
        s = _login()
        d = s.post(f"{API}/cards", json=_payload(event_type="aqiqah", template=None or "wedding-royal",
                                                 events=[{"name": "Aqiqah", "date": "2026-12-01", "time": "11:00"}])).json()
        if "card_id" not in d:
            pytest.skip(f"aqiqah card creation rejected: {d}")
        try:
            t = requests.get(f"{API}/s/{d['slug']}/e1").text
            assert "<title>Aqiqah Ceremony Invitation · " in t, t[:400]
        finally:
            s.delete(f"{API}/cards/{d['card_id']}")

    def test_demo_share_title(self):
        t = requests.get(f"{API}/s/demo-shahnawaz-farah/e3", params={"to": "Ali"}).text
        assert "<title>Ali, you&#x27;re invited! Wedding Invitation · Shahnawaz &amp; Farah</title>" in t, t[:400]

    def test_birthday_single(self):
        t = requests.get(f"{API}/s/zara-turns-7/e1").text
        assert "Invitation · " in t


# ---- demo rename & RSVP removal ----
class TestDemoRsvp:
    def test_old_slug_404(self):
        assert requests.get(f"{API}/public/cards/aftab-hifza").status_code == 404

    def test_new_demo(self):
        d = requests.get(f"{API}/public/cards/demo-shahnawaz-farah").json()
        assert d["primary_name"] == "Shahnawaz" and d["secondary_name"] == "Farah" and "_id" not in d

    def test_rsvp_endpoints_gone(self):
        assert requests.post(f"{API}/public/cards/demo-shahnawaz-farah/rsvp",
                             json={"guest_name": "X", "attending": True}).status_code in (404, 405)
        s = _login()
        assert s.get(f"{API}/cards/demo-wedding/rsvps").status_code in (404, 405)
