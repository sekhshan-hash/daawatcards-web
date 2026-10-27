# Creates TEST_ cards for iteration 6 UI checks (long names, past, live, guests). Prints JSON.
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
import requests

API = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
s = requests.Session()
phone = "97" + str(uuid.uuid4().int)[:8]
s.post(f"{API}/auth/otp/request", json={"phone": phone})
s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "123456", "name": "TEST_UI6"})
ist = datetime.now(timezone(timedelta(hours=5, minutes=30)))


def card(**kw):
    p = {"event_type": "wedding", "template": "wedding-royal", "primary_name": "Mohammad Shahnawaz Siddiqui",
         "secondary_name": "Farah Fatima", "title": "TEST Long", "status": "published", "music_track": "none",
         "host_whatsapp": "9876543210", "tradition": "muslim", "header_key": "bismillah",
         "events": [{"event_id": "e1", "name": "Nikah", "date": "2026-12-01", "time": "18:00"},
                    {"event_id": "e2", "name": "Walima", "date": "2026-12-03", "time": "19:00"}]}
    p.update(kw)
    r = s.post(f"{API}/cards", json=p)
    assert r.status_code in (200, 201), r.text
    return r.json()


long_c = card()
past = card(title="TEST Past", events=[{"event_id": "e1", "name": "Nikah", "date": "2025-06-01", "time": "18:00", "end_time": "21:00"}])
start = (ist - timedelta(minutes=60)).strftime("%H:%M")
end = (ist + timedelta(minutes=60)).strftime("%H:%M")
if ist.hour == 0 or ist.hour >= 23:
    start, end = "00:01", "23:59"
live = card(title="TEST Live", events=[{"event_id": "e1", "name": "Nikah", "date": ist.strftime("%Y-%m-%d"), "time": start, "end_time": end}])
g = s.post(f"{API}/cards/{long_c['card_id']}/guests/bulk", json={"guests": [
    {"name": "TEST One Event", "event_ids": ["e2"]}, {"name": "TEST Both", "event_ids": []}]}).json()
guests = s.get(f"{API}/cards/{long_c['card_id']}/guests").json()
print(json.dumps({"phone": phone, "long": [long_c["slug"], long_c["card_id"]], "past": past["slug"], "live": live["slug"],
                  "guests": [(x["name"], x["guest_id"], x["event_ids"]) for x in guests], "ist": ist.isoformat()}))
