# Daawat iteration 5: per-event colour schemes (events[].color), OG images per event, share page version
import os
import re
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
SCHEMES = ["emerald", "marigold", "magenta", "midnight", "crimson", "peacock", "coral", "lavender", "champagne", "blush"]


def _login():
    s = requests.Session()
    phone = "95" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_Colors"})
    assert r.status_code == 200, r.text
    return s


def _payload(events, slug=None):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "Tst", "secondary_name": "Clr",
         "title": "TEST Colors", "status": "published", "music_track": "none", "events": events}
    return p


EVS = [{"event_id": "e1", "name": "Mehndi", "date": "2026-12-01", "time": "18:00"},
       {"event_id": "e2", "name": "Nikah", "date": "2026-12-02", "time": "18:00"},
       {"event_id": "e3", "name": "Walima", "date": "2026-12-03", "time": "18:00"}]


@pytest.fixture(scope="module")
def ctx():
    s = _login()
    c = s.post(f"{API}/cards", json=_payload(EVS))
    assert c.status_code in (200, 201), c.text
    c = c.json()
    yield s, c
    s.delete(f"{API}/cards/{c['card_id']}")


# ---- events[].color validation & persistence ----
class TestEventColor:
    def test_default_color_empty(self, ctx):
        s, c = ctx
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert [e.get("color") for e in g["events"]] == ["", "", ""]

    @pytest.mark.parametrize("color", ["", "template"] + SCHEMES)
    def test_accept_valid(self, ctx, color):
        s, c = ctx
        evs = [dict(e) for e in EVS]
        evs[1]["color"] = color
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(evs))
        assert r.status_code == 200, r.text
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert g["events"][1]["color"] == color

    @pytest.mark.parametrize("color", ["red", "EMERALD", "auto", "#fff"])
    def test_reject_invalid(self, ctx, color):
        s, c = ctx
        evs = [dict(e) for e in EVS]
        evs[0]["color"] = color
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(evs))
        assert r.status_code == 422, r.text


# ---- OG images & share page on seeded demo card ----
class TestOG:
    def test_og_each_event_png(self):
        imgs = {}
        for eid in ["e1", "e2", "e3"]:
            r = requests.get(f"{API}/og/demo-shahnawaz-farah/{eid}.png")
            assert r.status_code == 200
            assert r.headers["content-type"] == "image/png"
            assert r.content[:8] == b"\x89PNG\r\n\x1a\n"
            imgs[eid] = r.content
        assert imgs["e1"] != imgs["e3"]

    def test_og_colors_differ(self):
        from io import BytesIO
        from PIL import Image
        px = {}
        for eid in ["e1", "e2", "e4"]:
            im = Image.open(BytesIO(requests.get(f"{API}/og/demo-shahnawaz-farah/{eid}.png").content)).convert("RGB")
            px[eid] = im.getpixel((30, im.height // 2))
        print("OG bg pixels", px)
        # iteration 6 demo: e1 Haldi marigold, e2 Baraat crimson, e4 Walima midnight
        assert px["e1"] != px["e4"] and px["e1"] != px["e2"]
        assert px["e2"][0] > px["e2"][2]  # reddish crimson
        assert px["e4"][2] > px["e4"][0]  # bluish midnight

    def test_share_version_differs(self):
        vs = {}
        for eid in ["e1", "e2", "e3"]:
            r = requests.get(f"{API}/s/demo-shahnawaz-farah/{eid}")
            assert r.status_code == 200
            m = re.search(r'og:image" content="([^"]+)"', r.text)
            assert m, r.text[:500]
            vs[eid] = re.search(r"v=([0-9a-f]+)", m.group(1)).group(1)
        assert len(set(vs.values())) == 3, vs

    def test_own_card_scheme_changes_og(self, ctx):
        s, c = ctx
        slug = s.get(f"{API}/cards/{c['card_id']}").json()["slug"]
        evs = [dict(e) for e in EVS]
        evs[0]["color"] = "template"
        s.put(f"{API}/cards/{c['card_id']}", json=_payload(evs))
        a = requests.get(f"{API}/og/{slug}/e1.png").content
        evs[0]["color"] = "lavender"
        s.put(f"{API}/cards/{c['card_id']}", json=_payload(evs))
        b = requests.get(f"{API}/og/{slug}/e1.png").content
        assert a != b

    def test_single_event_og_ok(self):
        r = requests.get(f"{API}/og/zara-turns-7/e1.png")
        assert r.status_code == 200 and r.content[:4] == b"\x89PNG"
