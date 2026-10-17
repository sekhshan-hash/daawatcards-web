import io
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

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
        "eyebrow_font": "Outfit.ttf", "name_font": "Fredoka.ttf", "body_font": "Outfit.ttf",
    },
}
PARTY = ["#FF6B6B", "#FFD166", "#4ECDC4", "#9D4EDD"]


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


def _center(draw, y, text, font, fill):
    w = draw.textlength(text, font=font)
    draw.text(((W - w) / 2, y), text, font=font, fill=fill)


def _royal_border(d, s):
    gold = _rgb(s["accent"])
    d.rectangle([24, 24, W - 24, H - 24], outline=gold, width=3)
    d.rectangle([38, 38, W - 38, H - 38], outline=gold, width=1)
    for cx, cy in [(24, 24), (W - 24, 24), (24, H - 24), (W - 24, H - 24)]:
        d.polygon([(cx, cy - 16), (cx + 16, cy), (cx, cy + 16), (cx - 16, cy)], fill=gold)
    cx = W // 2
    d.line([(cx - 160, 214), (cx - 22, 214)], fill=gold, width=2)
    d.line([(cx + 22, 214), (cx + 160, 214)], fill=gold, width=2)
    d.polygon([(cx, 202), (cx + 12, 214), (cx, 226), (cx - 12, 214)], fill=gold)


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


def render_og(template, eyebrow, names, event_line, date_line, venue_line, brand):
    s = STYLES.get(template, STYLES["wedding-royal"])
    img = Image.new("RGB", (W, H), s["bg"])
    d = ImageDraw.Draw(img)
    top, bot = _rgb(s["bg2"]), _rgb(s["bg"])
    for y in range(H):
        k = abs(y - H / 2) / (H / 2)
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] * (1 - k) + bot[i] * k) for i in range(3)))
    if template == "birthday-playful":
        _party_border(d)
    else:
        _royal_border(d, s)

    _center(d, 92, eyebrow.upper(), _fit(d, eyebrow.upper(), s["eyebrow_font"], 30, 900), _rgb(s["muted"]))
    nf = _fit(d, names, s["name_font"], 120, 1000)
    _center(d, 236, names, nf, _rgb(s["accent"]))
    _center(d, 400, event_line, _fit(d, event_line, s["body_font"], 44, 1000), _rgb(s["text"]))
    _center(d, 460, date_line, _fit(d, date_line, s["body_font"], 34, 1000), _rgb(s["text"]))
    if venue_line:
        _center(d, 510, venue_line, _fit(d, venue_line, s["body_font"], 28, 1000), _rgb(s["muted"]))
    _center(d, H - 62, brand, _font(s["eyebrow_font"], 20), _rgb(s["muted"]))

    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()
