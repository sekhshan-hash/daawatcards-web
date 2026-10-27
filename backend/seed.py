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
        "tradition": "muslim", "header_key": "bismillah",
        "family": {"groom_family": "Siddiqui", "bride_family": "Qureshi", "groom_parents": "Mr. & Mrs. Iqbal Siddiqui",
                   "bride_parents": "Mr. & Mrs. Arif Qureshi", "groom_grandparents": "", "bride_grandparents": "",
                   "host_side": "groom", "hidden": False},
        "events": [
            _ev("e1", "Haldi", "2026-12-09", "11:00", "Siddiqui Residence", "Road No. 3, Banjara Hills, Hyderabad",
                "Yellow and white", "A morning of ubtan, laughter and dholak.", "14:00"),
            _ev("e2", "Baraat", "2026-12-11", "18:30", "Noor Bagh Lawns", "Road No. 12, Banjara Hills, Hyderabad",
                "Festive, maroon and gold", "The baraat sets off from the groom's home at 6:30 PM.", "21:00"),
            _ev("e3", "Nikah", "2026-12-12", "19:00", "Masjid-e-Noor & Courtyard", "Jubilee Hills, Hyderabad",
                "Traditional, ivory or pastel", "The Nikah will be followed by dinner.", "23:00"),
            _ev("e4", "Walima", "2026-12-14", "20:00", "The Grand Durbar Hall", "Necklace Road, Hyderabad",
                "Formal / Sherwani & Lehenga", "Join us for the Walima reception and dinner.", "23:30"),
        ],
        "created_at": _NOW, "updated_at": _NOW,
    },
    {
        "card_id": "demo-hindu-wedding", "slug": "rohan-ananya", "owner_id": "demo-host", "status": "published",
        "event_type": "wedding", "template": "wedding-royal", "language": "en",
        "primary_name": "Rohan", "secondary_name": "Ananya",
        "host_family": "The Sharma & Iyer Families",
        "title": "Wedding Celebrations",
        "invitation_text": "With the blessings of our elders, we joyfully invite you and your family to celebrate the wedding of our children.",
        "blessing_key": "hindu", "blessing_text": "", "music_track": "royal-raag",
        "host_whatsapp": "", "timezone": "+05:30",
        "tradition": "hindu", "header_key": "ganesh",
        "family": {"groom_family": "Sharma", "bride_family": "Iyer", "groom_parents": "Mr. & Mrs. Rajesh Sharma",
                   "bride_parents": "Mr. & Mrs. Venkat Iyer", "groom_grandparents": "Smt. Kamla Devi & Late Shri Ramnath Sharma",
                   "bride_grandparents": "", "host_side": "groom", "hidden": False},
        "events": [
            _ev("e1", "Haldi", "2027-02-10", "10:00", "Sharma Niwas", "Civil Lines, Jaipur",
                "Yellow", "Come with old clothes and a big smile!", "13:00"),
            _ev("e2", "Mehndi", "2027-02-10", "17:00", "Sharma Niwas Lawns", "Civil Lines, Jaipur",
                "Shades of green", "Henna, music and chai under the fairy lights.", "21:00"),
            _ev("e3", "Sangeet", "2027-02-11", "19:30", "The Rambagh Courtyard", "Bhawani Singh Road, Jaipur",
                "Indo-western glam", "An evening of dance performances by both families.", "23:30"),
            _ev("e4", "Baraat", "2027-02-12", "18:00", "Hotel Raj Vilas Gate", "Goner Road, Jaipur",
                "Festive", "The baraat leaves at 6 PM sharp, dhol and all.", "19:30"),
            _ev("e5", "Pheras", "2027-02-12", "20:30", "Raj Vilas Mandap", "Goner Road, Jaipur",
                "Traditional", "The sacred pheras around the holy fire.", "23:30"),
            _ev("e6", "Reception", "2027-02-14", "19:30", "The Grand Ballroom, ITC Rajputana", "Palace Road, Jaipur",
                "Formal / Black tie", "Dinner and dancing to celebrate the newlyweds.", "23:30"),
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
