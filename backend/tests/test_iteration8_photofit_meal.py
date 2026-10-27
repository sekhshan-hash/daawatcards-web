# Daawat iteration 8: photo_fit (per photo shape/position/zoom/style) and meal per event (ICS, share page)
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _login():
    s = requests.Session()
    phone = "94" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_It8"})
    assert r.status_code == 200, r.text
    return s


FIT = {"shape": "arch", "x": 30, "y": 60, "zoom": 1.5, "style": "blended"}
EVS = [{"event_id": "e1", "name": "Nikah", "date": "2026-12-01", "time": "13:00", "venue_name": "TEST Hall",
        "meal": "lunch", "photo_fit": {"shape": "circle", "x": 40, "y": 40, "zoom": 2, "style": "framed"}},
       {"event_id": "e2", "name": "Walima", "date": "2026-12-02", "time": "20:00", "venue_name": "TEST Lawn",
        "meal": "custom", "meal_custom": "Biryani Feast", "meal_line": "TEST Biryani after the vows"},
       {"event_id": "e3", "name": "Mehndi", "date": "2026-12-03", "time": "18:00", "venue_name": "TEST Home", "meal": "none"}]


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "TEST Amir", "secondary_name": "Sara",
         "title": "TEST It8", "status": "published", "music_track": "none", "events": EVS, "tradition": "muslim",
         "photo_fit": {"hero": FIT, "feature": {"shape": "square"}, "wishes": {"shape": "wide", "style": "framed"}}}
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


class TestPhotoFit:
    def test_persisted(self, ctx):
        s, c = ctx
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        assert d["photo_fit"]["hero"] == FIT
        assert d["photo_fit"]["feature"]["shape"] == "square" and d["photo_fit"]["feature"]["zoom"] == 1
        assert d["events"][0]["photo_fit"]["shape"] == "circle"
        assert d["events"][0]["photo_fit"]["zoom"] == 2

    def test_put_update(self, ctx):
        s, c = ctx
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        d["photo_fit"] = {"hero": {"shape": "portrait", "x": 10, "y": 90, "zoom": 3.2, "style": "framed"}}
        r = s.put(f"{API}/cards/{c['card_id']}", json=d)
        assert r.status_code == 200, r.text
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert g["photo_fit"]["hero"]["shape"] == "portrait" and g["photo_fit"]["hero"]["zoom"] == 3.2
        assert "feature" not in g["photo_fit"]

    @pytest.mark.parametrize("bad", [{"hero": {"shape": "hexagon"}}, {"hero": {"style": "glow"}},
                                     {"hero": {"zoom": 9}}, {"hero": {"x": 150}}, {"banner": {"shape": "full"}}])
    def test_invalid_422(self, ctx, bad):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(photo_fit=bad))
        assert r.status_code == 422, (bad, r.status_code)

    def test_event_invalid_shape_422(self, ctx):
        s, c = ctx
        evs = [dict(EVS[0], photo_fit={"shape": "star"})]
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(events=evs))
        assert r.status_code == 422

    def test_public_has_fit(self, ctx):
        s, c = ctx
        p = requests.get(f"{API}/public/cards/{c['slug']}").json()
        assert "photo_fit" in p and "photo_fit" in p["events"][0]


class TestMeal:
    def test_meal_persisted(self, ctx):
        s, c = ctx
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        assert d["events"][0]["meal"] == "lunch"
        assert d["events"][1]["meal_custom"] == "Biryani Feast"
        assert d["events"][1]["meal_line"] == "TEST Biryani after the vows"
        assert d["events"][2]["meal"] == "none"

    def test_invalid_meal_422(self, ctx):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(events=[dict(EVS[0], meal="feast")]))
        assert r.status_code == 422

    def test_ics_lunch(self, ctx):
        _, c = ctx
        r = requests.get(f"{API}/public/cards/{c['slug']}/events/e1/ics")
        assert r.status_code == 200
        desc = [l for l in r.text.split("\r\n") if l.startswith("DESCRIPTION:")][0]
        assert "Lunch to follow" in desc, desc

    def test_ics_custom_line(self, ctx):
        _, c = ctx
        r = requests.get(f"{API}/public/cards/{c['slug']}/events/e2/ics")
        desc = [l for l in r.text.split("\r\n") if l.startswith("DESCRIPTION:")][0]
        assert "TEST Biryani after the vows" in desc, desc

    def test_ics_none(self, ctx):
        _, c = ctx
        r = requests.get(f"{API}/public/cards/{c['slug']}/events/e3/ics")
        desc = [l for l in r.text.split("\r\n") if l.startswith("DESCRIPTION:")][0]
        assert "follow" not in desc

    def test_share_desc_lunch(self, ctx):
        _, c = ctx
        r = requests.get(f"{API}/s/{c['slug']}/e1")
        assert r.status_code == 200
        line = [l for l in r.text.split("\n") if 'og:description' in l][0]
        assert "· Lunch · TEST Hall" in line, line
        assert " at " in line

    def test_share_desc_custom(self, ctx):
        _, c = ctx
        r = requests.get(f"{API}/s/{c['slug']}/e2")
        line = [l for l in r.text.split("\n") if 'og:description' in l][0]
        assert "· Biryani Feast · TEST Lawn" in line, line

    def test_share_desc_none(self, ctx):
        _, c = ctx
        r = requests.get(f"{API}/s/{c['slug']}/e3")
        line = [l for l in r.text.split("\n") if 'og:description' in l][0]
        assert "None" not in line and line.count("·") == 1, line
