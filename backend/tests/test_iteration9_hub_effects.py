# Daawat iteration 9: single photo placement (photo_place), hub_heading, effects, share link "cover"
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _login():
    s = requests.Session()
    phone = "95" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_It9"})
    assert r.status_code == 200, r.text
    return s


EVS = [{"event_id": "e1", "name": "Nikah", "date": "2026-12-01", "time": "13:00", "venue_name": "TEST Hall"},
       {"event_id": "e2", "name": "Walima", "date": "2026-12-02", "time": "20:00", "venue_name": "TEST Lawn"}]


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "TEST Amir", "secondary_name": "Sara",
         "title": "TEST It9", "status": "published", "music_track": "none", "events": EVS,
         "photo_place": "event:e2", "hub_heading": "TEST Our big days",
         "effects": {"fireworks": False, "vibration": False, "intensity": "high"}}
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


class TestNewFields:
    def test_create_persisted(self, ctx):
        s, c = ctx
        d = s.get(f"{API}/cards/{c['card_id']}").json()
        assert d["photo_place"] == "event:e2"
        assert d["hub_heading"] == "TEST Our big days"
        assert d["effects"] == {"fireworks": False, "vibration": False, "intensity": "high"}

    def test_public_has_fields(self, ctx):
        s, c = ctx
        p = requests.get(f"{API}/public/cards/{c['slug']}").json()
        assert p["photo_place"] == "event:e2" and p["hub_heading"] == "TEST Our big days"
        assert p["effects"]["intensity"] == "high"

    def test_put_update(self, ctx):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(photo_place="wishes", hub_heading="",
                                                                 effects={"fireworks": True, "vibration": True, "intensity": "low"}))
        assert r.status_code == 200, r.text
        g = s.get(f"{API}/cards/{c['card_id']}").json()
        assert g["photo_place"] == "wishes" and g["hub_heading"] == ""
        assert g["effects"] == {"fireworks": True, "vibration": True, "intensity": "low"}

    @pytest.mark.parametrize("place", ["cover", "intro", "wishes", "event:e1", ""])
    def test_valid_places(self, ctx, place):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(photo_place=place))
        assert r.status_code == 200, r.text
        assert r.json()["photo_place"] == place

    def test_defaults_when_missing(self):
        s = _login()
        p = _payload()
        for k in ("photo_place", "hub_heading", "effects"):
            p.pop(k)
        r = s.post(f"{API}/cards", json=p)
        assert r.status_code in (200, 201), r.text
        c = r.json()
        assert c["effects"] == {"fireworks": True, "vibration": True, "intensity": "medium"}
        assert c.get("photo_place", "") == ""
        s.delete(f"{API}/cards/{c['card_id']}")

    @pytest.mark.parametrize("bad", [{"photo_place": "foo"}, {"photo_place": "event:"}, {"photo_place": "event:a b"},
                                     {"hub_heading": "x" * 81}, {"effects": {"intensity": "max"}},
                                     {"effects": {"fireworks": "maybe"}}])
    def test_invalid_422(self, ctx, bad):
        s, c = ctx
        r = s.put(f"{API}/cards/{c['card_id']}", json=_payload(**bad))
        assert r.status_code == 422, (bad, r.status_code)

    def test_post_invalid_place_422(self):
        s = _login()
        r = s.post(f"{API}/cards", json=_payload(photo_place="foo"))
        assert r.status_code == 422


class TestShareCover:
    def test_cover_redirect(self, ctx):
        s, c = ctx
        r = requests.get(f"{API}/s/{c['slug']}/cover", params={"to": "Ali Khan"})
        assert r.status_code == 200
        assert f"/i/{c['slug']}?to=Ali+Khan" in r.text
        assert f"/i/{c['slug']}/" not in r.text.split("og:url")[1].split(">")[0]

    def test_event_redirect(self, ctx):
        s, c = ctx
        r = requests.get(f"{API}/s/{c['slug']}/e2")
        assert r.status_code == 200
        assert f"/i/{c['slug']}/e2" in r.text

    def test_demo_cover(self):
        r = requests.get(f"{API}/s/demo-shahnawaz-farah/cover")
        assert r.status_code == 200
        assert 'url=' in r.text and "/i/demo-shahnawaz-farah\"" in r.text.replace("'", '"')

    def test_unknown_slug_404(self):
        r = requests.get(f"{API}/s/TEST-nope-{uuid.uuid4().hex[:6]}/cover")
        assert r.status_code == 404
