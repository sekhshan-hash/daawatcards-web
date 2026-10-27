# Daawat iteration 6: tradition/header/family/wording fields, RSVP removed, OG per event, demo cards
import os
import uuid
from io import BytesIO
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _login(name="TEST_Trad"):
    s = requests.Session()
    phone = "96" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": name})
    assert r.status_code == 200, r.text
    return s


EVS = [{"event_id": "e1", "name": "Haldi", "date": "2026-12-01", "time": "11:00"},
       {"event_id": "e2", "name": "Baraat", "date": "2026-12-02", "time": "18:00", "header_hidden": True,
        "wording": "TEST custom wording", "dua": "TEST dua", "closing": "", "concluded": "TEST concluded",
        "rsvp_line": "Call Ali"},
       {"event_id": "e3", "name": "Nikah", "date": "2026-12-03", "time": "18:00"}]
FAMILY = {"groom_family": "Khan", "bride_family": "Siddiqui", "groom_parents": "Mr & Mrs Khan",
          "bride_parents": "Mr & Mrs Siddiqui", "groom_grandparents": "", "bride_grandparents": "Late Mr Ahmed",
          "host_side": "bride", "hidden": False}


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "Mohammad Shahnawaz Siddiqui",
         "secondary_name": "Farah Fatima", "title": "TEST Trad", "status": "published", "music_track": "none",
         "host_whatsapp": "9876543210", "events": EVS, "tradition": "muslim", "header_key": "bismillah", "family": FAMILY}
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


# ---- new card fields persist ----
class TestTraditionFields:
    def test_create_persists(self, ctx):
        s, c = ctx
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert g["tradition"] == "muslim" and g["header_key"] == "bismillah"
        assert g["family"]["host_side"] == "bride" and g["family"]["bride_grandparents"] == "Late Mr Ahmed"
        e2 = g["events"][1]
        assert e2["header_hidden"] is True and e2["wording"] == "TEST custom wording"
        assert e2["dua"] == "TEST dua" and e2["closing"] == "" and e2["concluded"] == "TEST concluded"
        assert e2["rsvp_line"] == "Call Ali"
        assert g["events"][0]["wording"] is None

    def test_update_persists_and_public(self, ctx):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(tradition="hindu", header_key="ganesh",
                                                                family={**FAMILY, "hidden": True}))
        assert r.status_code == 200, r.text
        p = requests.get(f"{API}/public/cards/{c['slug']}").json()
        assert p["tradition"] == "hindu" and p["header_key"] == "ganesh" and p["family"]["hidden"] is True

    @pytest.mark.parametrize("bad", [{"tradition": "jedi"}, {"tradition": "Muslim"},
                                     {"family": {**FAMILY, "host_side": "both"}}])
    def test_invalid_422(self, ctx, bad):
        s, c = ctx
        assert s.post(f"{API}/cards", json=_payload(**bad)).status_code == 422
        assert s.put(f"{API}/cards/{c['card_id']}", json=_payload(**bad)).status_code == 422

    def test_defaults_when_missing(self, ctx):
        s, _ = ctx
        p = _payload()
        for k in ("tradition", "header_key", "family"):
            p.pop(k)
        r = s.post(f"{API}/cards", json=p)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        try:
            assert d["tradition"] == "neutral" and d["header_key"] == "" and d["family"]["hidden"] is False
        finally:
            s.delete(f"{API}/cards/{d['card_id']}")


# ---- RSVP removed (iteration 7) ----
class TestRsvpRemoved:
    def test_public_rsvp_gone(self, ctx):
        _, c = ctx
        r = requests.post(f"{API}/public/cards/{c['slug']}/rsvp", json={"guest_name": "X", "attending": True})
        assert r.status_code in (404, 405)

    def test_owner_rsvps_gone(self, ctx):
        s, c = ctx
        assert s.get(f"{API}/cards/{c['card_id']}/rsvps").status_code in (404, 405)


# ---- demo cards & OG ----
class TestDemosOg:
    def test_shahnawaz_muslim(self):
        d = requests.get(f"{API}/public/cards/demo-shahnawaz-farah").json()
        assert d["tradition"] == "muslim"
        assert [e["name"] for e in d["events"]] == ["Haldi", "Baraat", "Nikah", "Walima"]

    def test_rohan_hindu(self):
        d = requests.get(f"{API}/public/cards/rohan-ananya").json()
        assert d["tradition"] == "hindu" and len(d["events"]) == 6

    def test_og_each_event(self):
        for slug, n in (("demo-shahnawaz-farah", 4), ("rohan-ananya", 6)):
            for i in range(1, n + 1):
                r = requests.get(f"{API}/og/{slug}/e{i}.png")
                assert r.status_code == 200 and r.headers["content-type"].startswith("image/png"), (slug, i)

    def test_baraat_og_crimson(self):
        from PIL import Image
        im = Image.open(BytesIO(requests.get(f"{API}/og/demo-shahnawaz-farah/e2.png").content)).convert("RGB").resize((60, 30))
        px = list(im.getdata())
        r, g, b = (sum(p[k] for p in px) / len(px) for k in range(3))
        assert r > g * 1.3 and r > b * 1.3, (r, g, b)
