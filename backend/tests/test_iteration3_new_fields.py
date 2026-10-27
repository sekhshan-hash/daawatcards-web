# Daawat iteration 3: new occasions/templates/music/heading_font validation, engagement slug, OG with/without photo
import io
import os
import uuid
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

NEW_TYPES = ["engagement", "aqiqah", "babyShower", "housewarming", "corporate"]
NEW_TPLS = ["modern-minimal", "rose-gold", "little-star", "warm-hearth", "boardroom"]
FONTS = ["default", "cinzel", "playfair", "greatvibes", "fredoka", "rozha"]


def _login():
    s = requests.Session()
    phone = "96" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_Host3"})
    assert r.status_code == 200, r.text
    return s, r.json()


def _payload(**kw):
    p = {"event_type": "engagement", "template": "rose-gold", "primary_name": "TestSana", "secondary_name": "Rehan",
         "title": "TEST Engagement", "status": "published", "music_track": "lullaby",
         "events": [{"name": "Engagement", "date": "2026-12-01", "time": "18:00", "venue_name": "Hall"}]}
    p.update(kw)
    return p


def _jpg():
    b = io.BytesIO()
    Image.new("RGB", (400, 500), (200, 80, 120)).save(b, "JPEG")
    return b.getvalue()


@pytest.fixture(scope="module")
def host():
    s, user = _login()
    created = []
    yield s, user, created
    for cid in created:
        s.delete(f"{API}/cards/{cid}")


class TestNewFields:
    @pytest.mark.parametrize("et", NEW_TYPES)
    def test_new_event_types(self, host, et):
        s, _, created = host
        r = s.post(f"{API}/cards", json=_payload(event_type=et))
        assert r.status_code == 200, r.text
        d = r.json()
        created.append(d["card_id"])
        assert d["event_type"] == et and d["heading_font"] == "default"
        g = s.get(f"{API}/cards/{d['card_id']}").json()
        assert g["event_type"] == et

    @pytest.mark.parametrize("tpl", NEW_TPLS)
    def test_new_templates(self, host, tpl):
        s, _, created = host
        r = s.post(f"{API}/cards", json=_payload(template=tpl, event_type="aqiqah"))
        assert r.status_code == 200, r.text
        created.append(r.json()["card_id"])
        assert r.json()["template"] == tpl

    @pytest.mark.parametrize("font", FONTS)
    def test_heading_fonts_create_update(self, host, font):
        s, _, created = host
        r = s.post(f"{API}/cards", json=_payload(heading_font=font))
        assert r.status_code == 200, r.text
        cid = r.json()["card_id"]
        created.append(cid)
        assert r.json()["heading_font"] == font
        u = s.put(f"{API}/cards/{cid}", json=_payload(heading_font="rozha"))
        assert u.status_code == 200 and u.json()["heading_font"] == "rozha"
        assert s.get(f"{API}/cards/{cid}").json()["heading_font"] == "rozha"
        slug = r.json()["slug"]
        pub = requests.get(f"{API}/public/cards/{slug}")
        if pub.status_code == 200:
            assert pub.json().get("heading_font") == "rozha"

    @pytest.mark.parametrize("bad", [{"event_type": "funeral"}, {"template": "neon"}, {"music_track": "rock"},
                                     {"heading_font": "comic"}, {"heading_font": ""}])
    def test_invalid_values_422(self, host, bad):
        s, _, created = host
        r = s.post(f"{API}/cards", json=_payload(**bad))
        assert r.status_code == 422, r.text
        r = s.post(f"{API}/cards", json=_payload())
        created.append(r.json()["card_id"])
        assert s.put(f"{API}/cards/{r.json()['card_id']}", json=_payload(**bad)).status_code == 422

    def test_lullaby_music(self, host):
        s, _, created = host
        r = s.post(f"{API}/cards", json=_payload(music_track="lullaby", template="little-star", event_type="aqiqah"))
        assert r.status_code == 200
        created.append(r.json()["card_id"])
        assert r.json()["music_track"] == "lullaby"

    def test_engagement_slug_uses_both_names(self, host):
        s, _, created = host
        name = "Tz" + uuid.uuid4().hex[:5]
        r1 = s.post(f"{API}/cards", json=_payload(primary_name=name, secondary_name="Rehan"))
        r2 = s.post(f"{API}/cards", json=_payload(primary_name=name, secondary_name="Rehan"))
        created += [r1.json()["card_id"], r2.json()["card_id"]]
        assert r1.json()["slug"] == f"{name.lower()}-rehan"
        assert r2.json()["slug"] == f"{name.lower()}-rehan-2"
        # non-couple type ignores secondary name
        r3 = s.post(f"{API}/cards", json=_payload(event_type="aqiqah", primary_name=name, secondary_name="X"))
        created.append(r3.json()["card_id"])
        assert r3.json()["slug"].startswith(name.lower()) and "-x" not in r3.json()["slug"]


class TestOG:
    @pytest.mark.parametrize("slug", ["meera-kabir", "sana-rehan", "ayaan", "the-sharmas", "acme-labs", "faraz",
                                      "demo-shahnawaz-farah", "zara-turns-7"])
    def test_og_seeded(self, slug):
        r = requests.get(f"{API}/og/{slug}/e1.png")
        assert r.status_code == 200 and r.content[:4] == b"\x89PNG"
        im = Image.open(io.BytesIO(r.content))
        assert im.size == (1200, 630)

    @pytest.mark.parametrize("tpl", NEW_TPLS)
    def test_og_new_template_with_and_without_photo(self, host, tpl):
        s, _, created = host
        up = s.post(f"{API}/uploads", files={"file": ("a.jpg", _jpg(), "image/jpeg")})
        assert up.status_code == 200, up.text
        path = up.json()["path"]
        lang = {"little-star": "ur", "warm-hearth": "hi"}.get(tpl, "en")
        a = s.post(f"{API}/cards", json=_payload(template=tpl, photos=[path], language=lang)).json()
        b = s.post(f"{API}/cards", json=_payload(template=tpl, language=lang)).json()
        created += [a["card_id"], b["card_id"]]
        ra = requests.get(f"{API}/og/{a['slug']}/e1.png")
        rb = requests.get(f"{API}/og/{b['slug']}/e1.png")
        assert ra.status_code == 200 and ra.content[:4] == b"\x89PNG"
        assert rb.status_code == 200 and rb.content[:4] == b"\x89PNG"
        assert ra.content != rb.content
        # photo layout: left region should contain the pinkish photo colour
        ia = Image.open(io.BytesIO(ra.content)).convert("RGB")
        px = ia.getpixel((300, 315))
        assert abs(px[0] - 200) < 40 and abs(px[1] - 80) < 40, px
