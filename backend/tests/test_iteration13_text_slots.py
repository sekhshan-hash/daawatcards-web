# Iteration 13: duplicated-wording fix. Creates a single-event Aqiqah card (TEST_) for UI checks and validates OG image.
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
H = {"Authorization": "Bearer test_session_host", "Content-Type": "application/json"}

PAYLOAD = {
    "event_type": "aqiqah", "template": "little-star", "tradition": "muslim", "language": "en",
    "primary_name": "TEST Ayaan", "secondary_name": "", "host_family": "TEST Khan Family",
    "title": "", "invitation_text": "", "blessing_key": "islamic", "status": "published", "agreed_terms": True,
    "events": [{"name": "Aqiqah", "date": "2026-12-20", "time": "12:00", "end_time": "15:00", "venue_name": "TEST Hall"}],
}


@pytest.fixture(scope="module")
def card():
    r = requests.post(f"{BASE_URL}/api/cards", json=PAYLOAD, headers=H)
    assert r.status_code == 200, r.text
    c = r.json()
    yield c
    if os.environ.get("KEEP_TEST_CARD") != "1":
        requests.delete(f"{BASE_URL}/api/cards/{c['card_id']}", headers=H)


def test_create_defaults(card):
    assert card["title"] == ""
    assert card["invitation_text"] == ""
    assert card["welcome_text"] == ""
    assert card["plan"] == "free"


def test_public_card_watermark(card):
    r = requests.get(f"{BASE_URL}/api/public/cards/{card['slug']}")
    assert r.status_code == 200
    d = r.json()
    assert d["watermark"] is True
    assert d["events"][0]["name"] == "Aqiqah"


def test_og_image(card):
    eid = card["events"][0]["event_id"]
    r = requests.get(f"{BASE_URL}/api/og/{card['slug']}/{eid}.png")
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    assert len(r.content) > 1000


def test_og_image_cover(card):
    r = requests.get(f"{BASE_URL}/api/og/{card['slug']}/cover.png")
    assert r.status_code == 200


def test_print_slug(card):
    print("SLUG", card["slug"], card["card_id"], card["events"][0]["event_id"])
