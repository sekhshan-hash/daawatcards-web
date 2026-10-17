from datetime import datetime, timezone

_NOW = datetime.now(timezone.utc).isoformat()


def _ev(event_id, name, date, time, venue, address, dress, text, end=""):
    return {
        "event_id": event_id, "name": name, "date": date, "time": time, "end_time": end,
        "venue_name": venue, "venue_address": address, "map_link": "",
        "dress_code": dress, "custom_text": text,
    }


DEMO_CARDS = [
    {
        "card_id": "demo-wedding", "slug": "aftab-hifza", "owner_id": "demo-host", "status": "published",
        "event_type": "wedding", "template": "wedding-royal", "language": "en",
        "primary_name": "Aftab", "secondary_name": "Hifza",
        "host_family": "The Siddiqui & Qureshi Families",
        "title": "Wedding Celebrations",
        "invitation_text": "With the blessings of the Almighty and the love of our elders, we joyfully invite you and your family to celebrate the union of our beloved children.",
        "blessing_key": "islamic", "blessing_text": "", "music_track": "royal-raag",
        "host_whatsapp": "", "timezone": "+05:30",
        "events": [
            _ev("e1", "Mehndi", "2026-12-10", "18:00", "Noor Bagh Lawns", "Road No. 12, Banjara Hills, Hyderabad",
                "Shades of green and yellow", "An evening of henna, dholak and dancing under the stars.", "22:30"),
            _ev("e2", "Nikah", "2026-12-12", "19:00", "Masjid-e-Noor & Courtyard", "Jubilee Hills, Hyderabad",
                "Traditional, ivory or pastel", "The Nikah will be followed by dinner.", "23:00"),
            _ev("e3", "Walima", "2026-12-14", "20:00", "The Grand Durbar Hall", "Necklace Road, Hyderabad",
                "Formal / Sherwani & Lehenga", "Join us for the Walima reception and dinner.", "23:30"),
        ],
        "created_at": _NOW, "updated_at": _NOW,
    },
    {
        "card_id": "demo-birthday", "slug": "zara-turns-7", "owner_id": "demo-host", "status": "published",
        "event_type": "birthday", "template": "birthday-playful", "language": "en",
        "primary_name": "Zara", "secondary_name": "is turning 7!",
        "host_family": "Ayesha & Imran Khan",
        "title": "Zara's Rainbow Birthday Bash",
        "invitation_text": "Balloons are up, the cake is ready and the music is loud. Come party with us!",
        "blessing_key": "birthday", "blessing_text": "", "music_track": "party-pop",
        "host_whatsapp": "", "timezone": "+05:30",
        "events": [
            _ev("e1", "Birthday Party", "2026-09-20", "16:00", "Jumping Jacks Play Cafe", "Hill Road, Bandra West, Mumbai",
                "Wear all the colours of the rainbow", "Games, magic show and a giant cake.", "19:00"),
        ],
        "created_at": _NOW, "updated_at": _NOW,
    },
]
