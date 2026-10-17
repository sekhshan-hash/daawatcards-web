# Daawat iteration 2: uploads/photos, guest list, opened tracking, wishes, stats, language, share redirect
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _login():
    s = requests.Session()
    phone = "97" + str(uuid.uuid4().int)[:8]
    s.post(f"{API}/auth/otp/request", json={"phone": phone})
    r = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_Host"})
    assert r.status_code == 200, r.text
    return s, r.json()


def _payload(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "Tst", "secondary_name": "Two",
         "title": "TEST Guests", "status": "published", "music_track": "none",
         "events": [{"name": "Mehndi", "date": "2026-12-01", "time": "18:00"},
                    {"name": "Nikah", "date": "2026-12-02", "time": "19:00"},
                    {"name": "Walima", "date": "2026-12-03", "time": "20:00"}]}
    p.update(kw)
    return p


@pytest.fixture(scope="module")
def host():
    s, user = _login()
    created = []
    yield s, user, created
    for cid in created:
        s.delete(f"{API}/cards/{cid}")


@pytest.fixture(scope="module")
def card(host):
    s, _, created = host
    c = s.post(f"{API}/cards", json=_payload()).json()
    created.append(c["card_id"])
    return c


def _jpg():
    return open("/tmp/test.jpg", "rb").read()


# ---- Uploads ----
class TestUploads:
    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/uploads", files={"file": ("a.jpg", _jpg(), "image/jpeg")})
        assert r.status_code == 401

    def test_upload_bad_type_and_size(self, host):
        s, _, _ = host
        assert s.post(f"{API}/uploads", files={"file": ("a.gif", b"GIF89a", "image/gif")}).status_code == 415
        big = b"\xff" * (8 * 1024 * 1024 + 10)
        assert s.post(f"{API}/uploads", files={"file": ("a.jpg", big, "image/jpeg")}).status_code == 413

    def test_upload_serve_and_attach(self, host):
        s, user, created = host
        r = s.post(f"{API}/uploads", files={"file": ("a.jpg", _jpg(), "image/jpeg")})
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path.startswith(f"invites/uploads/{user['user_id']}/")
        f = requests.get(f"{API}/files/{path}")
        assert f.status_code == 200 and f.headers["content-type"].startswith("image/jpeg") and f.content == _jpg()
        assert requests.get(f"{API}/files/invites/uploads/nope.jpg").status_code == 404
        p = _payload(photos=[path, ""], wishes_photo=path)
        p["events"][0]["photo"] = path
        c = s.post(f"{API}/cards", json=p)
        assert c.status_code == 200, c.text
        created.append(c.json()["card_id"])
        assert c.json()["photos"] == [path, ""] and c.json()["events"][0]["photo"] == path
        pub = requests.get(f"{API}/public/cards/{c.json()['slug']}").json()
        assert pub["wishes_photo"] == path
        # bad paths
        assert s.post(f"{API}/cards", json=_payload(photos=["invites/uploads/other/x.jpg"])).status_code == 422
        assert s.post(f"{API}/cards", json=_payload(photos=[path, path, path])).status_code == 422
        other, _ = _login()
        assert other.post(f"{API}/cards", json=_payload(wishes_photo=path)).status_code == 422
        p2 = _payload(); p2["events"][1]["photo"] = "https://evil.com/x.jpg"
        assert s.put(f"{API}/cards/{c.json()['card_id']}", json=p2).status_code == 422


# ---- Guests ----
class TestGuests:
    def test_bulk_normalise_dedupe_events(self, host, card):
        s, _, _ = host
        cid = card["card_id"]
        r = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [
            {"name": "TEST  Ali", "phone": "98765 43210", "event_ids": ["e2"]},
            {"name": "TEST Bob", "phone": "", "event_ids": ["e9"]},
            {"name": "TEST Dup", "phone": "+91 9876543210"},
            {"name": "test bob", "phone": ""},
            {"name": "TEST Zed", "phone": "09123456789", "event_ids": []},
        ]})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["added"] == 3 and d["skipped"] == 2
        by = {g["name"]: g for g in d["guests"]}
        assert by["TEST Ali"]["phone"] == "+919876543210" and by["TEST Ali"]["event_ids"] == ["e2"]
        assert by["TEST Bob"]["phone"] == "" and by["TEST Bob"]["event_ids"] == ["e1", "e2", "e3"]
        assert by["TEST Zed"]["phone"] == "+919123456789"
        # dedupe against existing
        r2 = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [{"name": "X", "phone": "9876543210"}]})
        assert r2.json()["added"] == 0 and r2.json()["skipped"] == 1
        lst = s.get(f"{API}/cards/{cid}/guests").json()
        assert len(lst) == 3 and all("_id" not in g for g in lst)

    def test_update_sent_delete(self, host, card):
        s, _, _ = host
        cid = card["card_id"]
        g = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [{"name": "TEST Edit", "phone": "9000011111"}]}).json()["guests"][0]
        r = s.put(f"{API}/cards/{cid}/guests/{g['guest_id']}", json={"name": "TEST Edited", "phone": "9000022222", "event_ids": ["e1", "e3"]})
        assert r.status_code == 200 and r.json()["name"] == "TEST Edited" and r.json()["phone"] == "+919000022222"
        assert r.json()["event_ids"] == ["e1", "e3"]
        assert s.put(f"{API}/cards/{cid}/guests/nope", json={"name": "x"}).status_code == 404
        r = s.post(f"{API}/cards/{cid}/guests/{g['guest_id']}/sent")
        assert r.status_code == 200 and r.json()["sent_at"]
        assert s.delete(f"{API}/cards/{cid}/guests/{g['guest_id']}").status_code == 200
        assert all(x["guest_id"] != g["guest_id"] for x in s.get(f"{API}/cards/{cid}/guests").json())

    def test_owner_scoped(self, card):
        other, _ = _login()
        cid = card["card_id"]
        assert other.get(f"{API}/cards/{cid}/guests").status_code == 404
        assert other.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [{"name": "x"}]}).status_code == 404
        assert other.get(f"{API}/cards/{cid}/wishes").status_code == 404
        assert requests.get(f"{API}/cards/{cid}/guests").status_code == 401


# ---- Public opened / wishes / stats ----
class TestPublicGuest:
    def test_opened_and_stats(self, host, card):
        s, _, _ = host
        cid, slug = card["card_id"], card["slug"]
        g = s.post(f"{API}/cards/{cid}/guests/bulk", json={"guests": [{"name": "TEST Open", "event_ids": ["e1", "e3"]}]}).json()["guests"][0]
        r = requests.post(f"{API}/public/cards/{slug}/opened", json={"guest_id": g["guest_id"]})
        assert r.status_code == 200 and r.json() == {"name": "TEST Open", "event_ids": ["e1", "e3"]}
        first = [x for x in s.get(f"{API}/cards/{cid}/guests").json() if x["guest_id"] == g["guest_id"]][0]
        requests.post(f"{API}/public/cards/{slug}/opened", json={"guest_id": g["guest_id"]})
        second = [x for x in s.get(f"{API}/cards/{cid}/guests").json() if x["guest_id"] == g["guest_id"]][0]
        assert first["opened_at"] and second["opened_at"] == first["opened_at"] and second["open_count"] == 2
        assert requests.post(f"{API}/public/cards/{slug}/opened", json={"guest_id": "unknown"}).status_code == 404
        # wishes
        w = requests.post(f"{API}/public/cards/{slug}/wishes", json={"guest_name": " TEST  Open ", "message": "Mubarak!", "event_id": "e3", "guest_id": g["guest_id"]})
        assert w.status_code == 200 and w.json()["guest_name"] == "TEST Open" and w.json()["event_name"] == "Walima"
        assert requests.post(f"{API}/public/cards/{slug}/wishes", json={"guest_name": "", "message": "x"}).status_code == 422
        assert requests.post(f"{API}/public/cards/{slug}/wishes", json={"guest_name": "a", "message": "   "}).status_code == 422
        ws = s.get(f"{API}/cards/{cid}/wishes").json()
        assert any(x["message"] == "Mubarak!" for x in ws) and all("_id" not in x for x in ws)
        st = [c for c in s.get(f"{API}/cards").json() if c["card_id"] == cid][0]["stats"]
        assert st["opened"] >= 1 and st["wishes"] >= 1 and st["guests"] >= 1  # >=1: xdist loadscope may split classes so card fixture differs per worker

    def test_old_rsvp_removed(self, card):
        r = requests.post(f"{API}/public/cards/{card['slug']}/events/e1/rsvp", json={"guest_name": "x", "status": "yes"})
        assert r.status_code in (404, 405)

    def test_share_redirect_keeps_g(self, card):
        r = requests.get(f"{API}/s/{card['slug']}/e2", params={"to": "TEST Ali", "g": "abc123"})
        assert r.status_code == 200 and "g=abc123" in r.text and "to=TEST+Ali" in r.text

    def test_delete_card_cascades(self, host):
        s, _, _ = host
        c = s.post(f"{API}/cards", json=_payload()).json()
        g = s.post(f"{API}/cards/{c['card_id']}/guests/bulk", json={"guests": [{"name": "TEST Cascade"}]}).json()["guests"][0]
        requests.post(f"{API}/public/cards/{c['slug']}/wishes", json={"guest_name": "a", "message": "b"})
        assert s.delete(f"{API}/cards/{c['card_id']}").status_code == 200
        # recreate check via opened -> card gone => 404
        assert requests.post(f"{API}/public/cards/{c['slug']}/opened", json={"guest_id": g["guest_id"]}).status_code == 404


# ---- Language ----
class TestLanguage:
    def test_language_values_and_og(self, host):
        s, _, created = host
        assert s.post(f"{API}/cards", json=_payload(language="fr")).status_code == 422
        for lang in ("en", "hi"):
            r = s.post(f"{API}/cards", json=_payload(language=lang))
            assert r.status_code == 200 and r.json()["language"] == lang
            created.append(r.json()["card_id"])
        r = s.post(f"{API}/cards", json=_payload(language="ur", title="شادی کی تقریبات",
                                                 events=[{"name": "مہندی", "date": "2026-12-01", "time": "18:00", "venue_name": "ہال"}]))
        assert r.status_code == 200
        created.append(r.json()["card_id"])
        og = requests.get(f"{API}/og/{r.json()['slug']}/e1.png")
        assert og.status_code == 200 and og.headers["content-type"] == "image/png" and og.content[:4] == b"\x89PNG"
        sh = requests.get(f"{API}/s/{r.json()['slug']}/e1", params={"to": "علی"})
        assert sh.status_code == 200

    def test_faraz_urdu_card(self):
        r = requests.get(f"{API}/public/cards/faraz")
        assert r.status_code == 200 and r.json()["language"] == "ur"
        assert requests.get(f"{API}/og/faraz/e1.png").status_code == 200
