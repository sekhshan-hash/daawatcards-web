import io
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

FONT_DIR = Path(__file__).parent / "fonts"
FALLBACK = "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"
W, H = 1200, 630

STYLES = {
    "wedding-royal": {
        "bg": "#2B070C", "bg2": "#4A0E17", "accent": "#D4AF37", "text": "#FDFBF7", "muted": "#E5C158",
        "eyebrow_font": "Cinzel.ttf", "name_font": "GreatVibes.ttf", "body_font": "Cormorant.ttf",
    },
    "birthday-playful": {
        "bg": "#0D1B2A", "bg2": "#1B263B", "accent": "#FFD166", "text": "#FFFFFF", "muted": "#4ECDC4",
        "eyebrow_font": "Outfit.ttf", "name_font": "Fredoka.ttf", "body_font": "Outfit.ttf", "frame": "circle",
    },
    "modern-minimal": {
        "bg": "#FAFAF7", "bg2": "#E6EDE4", "accent": "#3E5B48", "text": "#2F3A33", "muted": "#6F8F76",
        "eyebrow_font": "Cormorant.ttf", "name_font": "Cormorant.ttf", "body_font": "Cormorant.ttf", "frame": "rounded",
    },
    "rose-gold": {
        "bg": "#FBEFEF", "bg2": "#F2D3D3", "accent": "#A35A66", "text": "#4A2C32", "muted": "#B76E79",
        "eyebrow_font": "Cormorant.ttf", "name_font": "GreatVibes.ttf", "body_font": "Cormorant.ttf", "frame": "arch",
    },
    "little-star": {
        "bg": "#E8EEFB", "bg2": "#F8E3EE", "accent": "#5A6FB0", "text": "#3A3F5C", "muted": "#8C7AE6",
        "eyebrow_font": "Outfit.ttf", "name_font": "Fredoka.ttf", "body_font": "Outfit.ttf", "frame": "circle",
    },
    "warm-hearth": {
        "bg": "#F5EBDD", "bg2": "#EBD3B5", "accent": "#A8441F", "text": "#3B2418", "muted": "#C0562F",
        "eyebrow_font": "Cinzel.ttf", "name_font": "Cinzel.ttf", "body_font": "Cormorant.ttf", "frame": "arch",
    },
    "boardroom": {
        "bg": "#0B1B33", "bg2": "#16305A", "accent": "#FFFFFF", "text": "#E8EDF5", "muted": "#7FA7E8",
        "eyebrow_font": "Outfit.ttf", "name_font": "Outfit.ttf", "body_font": "Outfit.ttf", "frame": "rounded",
    },
}
STYLES["wedding-royal"]["frame"] = "arch"
PARTY = ["#FF6B6B", "#FFD166", "#4ECDC4", "#9D4EDD"]

# Per-event colour schemes (bg, bg2, accent, text, muted), mirroring frontend/src/templates/eventColors.js.
SCHEMES = {
    "emerald": {"dark": ("#0B2A1E", "#134232", "#D9B44A", "#F2F7EE", "#A7D7A0"), "light": ("#EEF6E9", "#DCEBD3", "#2F6B3F", "#1F3324", "#1E4D2B")},
    "marigold": {"dark": ("#3A2405", "#5A3A08", "#FFC93C", "#FFF8E6", "#FFE7A3"), "light": ("#FFF6D6", "#FFE89A", "#9A6400", "#3D2A05", "#7A4D00")},
    "magenta": {"dark": ("#2E0626", "#4D0D40", "#FF5FB8", "#FFF0F8", "#FFC2E5"), "light": ("#FDEAF4", "#F8CFE5", "#B0136E", "#3F0A2B", "#860F55")},
    "midnight": {"dark": ("#0A1230", "#14204D", "#E3C77A", "#EEF2FF", "#AFC3FF"), "light": ("#E9EEFB", "#D3DCF5", "#22336E", "#141D3D", "#15224F")},
    "crimson": {"dark": ("#3A0A10", "#5C1019", "#F2C14E", "#FFF5EC", "#FFDDA1"), "light": ("#FBEDEA", "#F3D3CC", "#9B1C2C", "#3A0D13", "#73121F")},
    "peacock": {"dark": ("#06282D", "#0C3F47", "#E8C766", "#EFFAF9", "#7FD6D0"), "light": ("#E6F5F4", "#C9EAE7", "#0E6E73", "#0F2E30", "#0A5054")},
    "coral": {"dark": ("#33140E", "#552218", "#FF9A76", "#FFF4EF", "#FFD3BF"), "light": ("#FFF0EA", "#FFD9C9", "#B5482A", "#3E1A10", "#93391D")},
    "lavender": {"dark": ("#1E1636", "#2F2456", "#C9B6FF", "#F6F2FF", "#F0E8FF"), "light": ("#F2EEFB", "#E2D9F6", "#6A4FB3", "#2A2045", "#4D378A")},
    "champagne": {"dark": ("#2A2418", "#3F3624", "#E9D29A", "#FBF7EC", "#FFF3D1"), "light": ("#FBF7EE", "#F1E8D3", "#8C6A2A", "#2E2615", "#6B4F1C")},
    "blush": {"dark": ("#2E1219", "#4A1E29", "#F7B2C4", "#FFF3F6", "#FFE0E8"), "light": ("#FDEFF2", "#F8D9E0", "#B04A66", "#3F1B25", "#8A3550")},
}
AUTO_SCHEMES = [
    ("emerald", re.compile(r"meh[ae]?ndi|henna|मेहंदी|मेहन्दी|मेंहदी|مہندی|مهندی", re.I)),
    ("marigold", re.compile(r"haldi|ubtan|pithi|may[ou]n|हल्दी|हलदी|ہلدی|هلدی|مایوں", re.I)),
    ("magenta", re.compile(r"sang[ei]{1,2}t|dholki|संगीत|ढोलकी|سنگیت|ڈھولکی", re.I)),
    ("crimson", re.compile(r"baraa?t|बारात|بارات", re.I)),
    ("midnight", re.compile(r"wal[ei]ma|valima|reception|वलीमा|वलिमा|रिसेप्शन|ولیمہ|ولیمه|استقبالیہ|ریسیپشن", re.I)),
]


def event_scheme(card, ev):
    if len(card.get("events", [])) < 2:
        return None
    color = ev.get("color", "")
    if color == "template":
        return None
    if color in SCHEMES:
        return color
    return next((sid for sid, rx in AUTO_SCHEMES if rx.search(ev.get("name", ""))), None)


def _with_scheme(s, scheme):
    if scheme not in SCHEMES:
        return s
    r, g, b = _rgb(s["bg"])
    tone = "dark" if (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5 else "light"
    return {**s, **dict(zip(("bg", "bg2", "accent", "text", "muted"), SCHEMES[scheme][tone], strict=True))}


def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _font(name, size):
    path = FONT_DIR / name
    try:
        return ImageFont.truetype(str(path if path.exists() else FALLBACK), size)
    except OSError:
        return ImageFont.truetype(FALLBACK, size)


def _script_font(text, fname):
    if re.search(r"[\u0900-\u097F]", text):
        return "NotoDevanagari.ttf"
    if re.search(r"[\u0600-\u06FF]", text):
        return "NotoNastaliq.ttf"
    return fname


def _fit(draw, text, fname, size, maxw):
    fname = _script_font(text, fname)
    f = _font(fname, size)
    while draw.textlength(text, font=f) > maxw and size > 22:
        size -= 4
        f = _font(fname, size)
    return f


def _center(draw, yc, text, font, fill, x0=0, w=W):
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    draw.text((x0 + (w - (right - left)) / 2 - left, yc - (top + bottom) / 2), text, font=font, fill=fill)


def _royal_border(d, s, cx=W // 2):
    gold = _rgb(s["accent"])
    d.rectangle([24, 24, W - 24, H - 24], outline=gold, width=3)
    d.rectangle([38, 38, W - 38, H - 38], outline=gold, width=1)
    for x, y in [(24, 24), (W - 24, 24), (24, H - 24), (W - 24, H - 24)]:
        d.polygon([(x, y - 16), (x + 16, y), (x, y + 16), (x - 16, y)], fill=gold)
    d.line([(cx - 160, 196), (cx - 22, 196)], fill=gold, width=2)
    d.line([(cx + 22, 196), (cx + 160, 196)], fill=gold, width=2)
    d.polygon([(cx, 184), (cx + 12, 196), (cx, 208), (cx - 12, 196)], fill=gold)


def _line_border(d, s):
    d.rectangle([30, 30, W - 30, H - 30], outline=_rgb(s["muted"]), width=2)


def _shape_mask(size, shape):
    w, h = size
    m = Image.new("L", size, 0)
    md = ImageDraw.Draw(m)
    if shape == "circle":
        md.ellipse([0, 0, w - 1, h - 1], fill=255)
    elif shape == "arch":
        md.ellipse([0, 0, w - 1, w - 1], fill=255)
        md.rectangle([0, w // 2, w - 1, h - 1], fill=255)
    else:
        md.rounded_rectangle([0, 0, w - 1, h - 1], radius=28, fill=255)
    return m


def _paste_photo(img, photo_bytes, s):
    shape = s.get("frame", "rounded")
    pw, ph = (400, 400) if shape == "circle" else (380, 480)
    x, y = 90, (H - ph) // 2
    photo = ImageOps.fit(Image.open(io.BytesIO(photo_bytes)).convert("RGB"), (pw, ph))
    pad = 10
    ring = _shape_mask((pw + pad * 2, ph + pad * 2), shape)
    img.paste(Image.new("RGB", ring.size, s["accent"]), (x - pad, y - pad), ring)
    img.paste(photo, (x, y), _shape_mask((pw, ph), shape))


def _party_border(d):
    for i in range(28):
        x = 40 + i * 41
        y = 30 + 10 * math.sin(i)
        d.polygon([(x, y), (x + 30, y), (x + 15, y + 34)], fill=_rgb(PARTY[i % 4]))
    for i in range(40):
        x = (i * 211) % W
        y = 120 + (i * 137) % (H - 160)
        if 180 < x < W - 180 and 160 < y < H - 90:
            continue
        r = 4 + i % 6
        d.ellipse([x - r, y - r, x + r, y + r], fill=_rgb(PARTY[i % 4]))


def render_og(template, eyebrow, names, event_line, date_line, venue_line, brand, photo=None, scheme=None, watermark=False):
    s = _with_scheme(STYLES.get(template, STYLES["wedding-royal"]), scheme)
    img = Image.new("RGB", (W, H), s["bg"])
    d = ImageDraw.Draw(img)
    top, bot = _rgb(s["bg2"]), _rgb(s["bg"])
    for y in range(H):
        k = abs(y - H / 2) / (H / 2)
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] * (1 - k) + bot[i] * k) for i in range(3)))
    x0, tw = 0, W
    if photo:
        try:
            _paste_photo(img, photo, s)
            x0, tw = 520, W - 560
        except Exception:  # noqa: BLE001
            pass
    cx = x0 + tw // 2
    if template == "birthday-playful":
        _party_border(d)
    elif template == "wedding-royal":
        _royal_border(d, s, cx)
    else:
        _line_border(d, s)
    maxw = tw - 80
    c = lambda y, text, font, fill: _center(d, y, text, font, fill, x0, tw)  # noqa: E731
    c(130, eyebrow.upper(), _fit(d, eyebrow.upper(), s["eyebrow_font"], 30, maxw), _rgb(s["muted"]))
    c(300, names, _fit(d, names, s["name_font"], 110 if not photo else 88, maxw), _rgb(s["accent"]))
    c(412, event_line, _fit(d, event_line, s["body_font"], 40, maxw), _rgb(s["text"]))
    c(466, date_line, _fit(d, date_line, s["body_font"], 32, maxw), _rgb(s["text"]))
    if venue_line:
        c(518, venue_line, _fit(d, venue_line, s["body_font"], 26, maxw), _rgb(s["muted"]))
    c(H - 58, brand, _font(s["eyebrow_font"], 20), _rgb(s["muted"]))

    if watermark:
        d.rounded_rectangle([W - 400, H - 84, W - 24, H - 24], radius=30, fill=(0, 0, 0))
        d.text((W - 212, H - 54), "Made with Daawat", font=_font(s["body_font"], 28), fill=(255, 255, 255), anchor="mm")

    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()
