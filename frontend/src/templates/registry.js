import { useEffect } from "react";
import { RoyalIntro } from "./royal/RoyalIntro";
import { RoyalFrame, RoyalDivider, Petals } from "./royal/RoyalArt";
import { BalloonIntro } from "./birthday/BalloonIntro";
import { BirthdayFrame, BirthdayDivider, Confetti, renderPlayfulName } from "./birthday/BirthdayArt";
import { SoftFade } from "./more/common";
import { EnvelopeIntro, MinimalDivider, MinimalFrame } from "./more/ModernMinimal";
import { RingsIntro, RoseDivider, RoseFrame, Sparkles } from "./more/RoseGold";
import { CloudIntro, StarDivider, StarFrame, TwinkleStars } from "./more/LittleStar";
import { DiyaRow, DoorIntro, HearthDivider, HearthFrame } from "./more/WarmHearth";
import { BoardDivider, BoardFrame, LineIntro } from "./more/Boardroom";

const GF = "https://fonts.googleapis.com/css2?display=swap&family=";
const UR = { family: "'Noto Nastaliq Urdu'", href: `${GF}Noto+Nastaliq+Urdu:wght@400;600` };
const HI_SERIF = { family: "'Tiro Devanagari Hindi'", href: `${GF}Tiro+Devanagari+Hindi` };
const HI_SANS = { family: "'Baloo 2'", href: `${GF}Baloo+2:wght@500;700` };

export const HEADING_FONTS = {
  cinzel: { family: "'Cinzel Decorative'", generic: "serif", href: `${GF}Cinzel+Decorative:wght@400;700` },
  playfair: { family: "'Playfair Display'", generic: "serif", href: `${GF}Playfair+Display:ital,wght@0,500;0,700;1,500` },
  greatvibes: { family: "'Great Vibes'", generic: "cursive", href: `${GF}Great+Vibes` },
  fredoka: { family: "'Fredoka'", generic: "sans-serif", href: `${GF}Fredoka:wght@500;600;700` },
  rozha: { family: "'Rozha One'", generic: "serif", href: `${GF}Rozha+One` },
};

// Each template = theme config (CSS variables, fonts, music) + its own intro, particles and ornaments.
// Add a new template by creating its components and registering an entry here.
export const TEMPLATES = {
  "wedding-royal": {
    id: "wedding-royal",
    eventTypes: ["wedding"],
    className: "tpl-royal", sample: "A & H",
    fontsHref: "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&display=swap",
    defaultMusic: "royal-raag",
    particleMs: 12000,
    swatch: ["#2B070C", "#4A0E17", "#D4AF37", "#FDFBF7"],
    vars: {
      "--bg": "#2B070C", "--bg2": "#4A0E17", "--surface": "#380911", "--accent": "#D4AF37", "--accent2": "#F3E5AB",
      "--text": "#F7F3E9", "--muted": "rgba(247,243,233,0.78)", "--border": "rgba(212,175,55,0.42)",
      "--btn-bg": "#D4AF37", "--btn-text": "#1F0508", "--radius": "4px", "--btn-radius": "2px",
    },
    fonts: { display: ["'Great Vibes'", "cursive"], title: ["'Cinzel Decorative'", "serif"], body: ["'Cormorant Garamond'", "serif"] },
    langFonts: {
      hi: { family: "'Tiro Devanagari Hindi'", href: "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&display=swap" },
      ur: { family: "'Noto Nastaliq Urdu'", href: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600&display=swap" },
    },
    Intro: RoyalIntro,
    Particles: Petals,
    Frame: RoyalFrame,
    Divider: RoyalDivider,
  },
  "birthday-playful": {
    id: "birthday-playful",
    eventTypes: ["birthday"],
    className: "tpl-bday", sample: "Zara!",
    fontsHref: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Outfit:wght@400;500;600&display=swap",
    defaultMusic: "party-pop",
    particleMs: 3500,
    swatch: ["#0D1B2A", "#FF6B6B", "#FFD166", "#4ECDC4"],
    vars: {
      "--bg": "#0D1B2A", "--bg2": "#1B263B", "--surface": "#162436", "--accent": "#FFD166", "--accent2": "#FF6B6B",
      "--accent3": "#4ECDC4", "--accent4": "#9D4EDD", "--text": "#FFFFFF", "--muted": "#C3D3E8",
      "--border": "rgba(78,205,196,0.4)", "--btn-bg": "#FFD166", "--btn-text": "#0D1B2A", "--radius": "22px", "--btn-radius": "999px",
    },
    fonts: { display: ["'Fredoka'", "sans-serif"], title: ["'Fredoka'", "sans-serif"], body: ["'Outfit'", "sans-serif"] },
    langFonts: {
      hi: { family: "'Baloo 2'", href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&display=swap" },
      ur: { family: "'Noto Nastaliq Urdu'", href: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600&display=swap" },
    },
    Intro: BalloonIntro,
    Particles: Confetti,
    Frame: BirthdayFrame,
    Divider: BirthdayDivider,
    renderName: renderPlayfulName,
  },
  "modern-minimal": {
    id: "modern-minimal", eventTypes: ["wedding"], className: "tpl-minimal", sample: "A & H",
    fontsHref: `${GF}Italiana&family=Jost:wght@300;400;500`, defaultMusic: "none", particleMs: 1300,
    swatch: ["#FAFAF7", "#DCE5D8", "#7C9A82", "#3E5B48"],
    vars: { "--bg": "#FAFAF7", "--bg2": "#EEF2EC", "--surface": "#FFFFFF", "--accent": "#6F8F76", "--accent2": "#3E5B48", "--text": "#2F3A33", "--muted": "#5E6B62",
      "--border": "rgba(111,143,118,0.35)", "--btn-bg": "#3E5B48", "--btn-text": "#FFFFFF", "--radius": "2px", "--btn-radius": "999px" },
    fonts: { display: ["'Italiana'", "serif"], title: ["'Jost'", "sans-serif"], body: ["'Jost'", "sans-serif"] },
    langFonts: { hi: HI_SERIF, ur: UR },
    Intro: EnvelopeIntro, Particles: SoftFade, Frame: MinimalFrame, Divider: MinimalDivider,
  },
  "rose-gold": {
    id: "rose-gold", eventTypes: ["engagement"], className: "tpl-rose", sample: "S & R",
    fontsHref: `${GF}Pinyon+Script&family=Marcellus&family=Lora:ital@0;1`, defaultMusic: "music-box", particleMs: 4500,
    swatch: ["#FBEFEF", "#F2D3D3", "#B76E79", "#8E4A55"],
    vars: { "--bg": "#FBEFEF", "--bg2": "#F6DCDC", "--surface": "#FFF8F7", "--accent": "#A35A66", "--accent2": "#8E4A55", "--text": "#4A2C32", "--muted": "#7A5A60",
      "--border": "rgba(183,110,121,0.38)", "--btn-bg": "#B76E79", "--btn-text": "#FFFFFF", "--radius": "14px", "--btn-radius": "999px" },
    fonts: { display: ["'Pinyon Script'", "cursive"], title: ["'Marcellus'", "serif"], body: ["'Lora'", "serif"] },
    langFonts: { hi: HI_SERIF, ur: UR },
    Intro: RingsIntro, Particles: Sparkles, Frame: RoseFrame, Divider: RoseDivider,
  },
  "little-star": {
    id: "little-star", eventTypes: ["aqiqah", "babyShower"], className: "tpl-star", sample: "Ayaan",
    fontsHref: `${GF}Baloo+2:wght@500;700&family=Nunito:wght@400;600;700`, defaultMusic: "lullaby", particleMs: 6000,
    swatch: ["#E8EEFB", "#F8E8F0", "#8C7AE6", "#FFE08A"],
    vars: { "--bg": "#E8EEFB", "--bg2": "#F8E8F0", "--surface": "#FFFFFF", "--accent": "#7464D1", "--accent2": "#4B5DA3", "--text": "#363B58", "--muted": "#5E6385",
      "--border": "rgba(140,122,230,0.32)", "--btn-bg": "#8C7AE6", "--btn-text": "#FFFFFF", "--radius": "22px", "--btn-radius": "999px" },
    fonts: { display: ["'Baloo 2'", "sans-serif"], title: ["'Baloo 2'", "sans-serif"], body: ["'Nunito'", "sans-serif"] },
    langFonts: { hi: HI_SANS, ur: UR },
    Intro: CloudIntro, Particles: TwinkleStars, Frame: StarFrame, Divider: StarDivider,
  },
  "warm-hearth": {
    id: "warm-hearth", eventTypes: ["housewarming"], className: "tpl-hearth", sample: "The Sharmas",
    fontsHref: `${GF}Yatra+One&family=Mukta:wght@400;600`, defaultMusic: "royal-raag", particleMs: 6500,
    swatch: ["#F5EBDD", "#C0562F", "#E0A526", "#5E7D3A"],
    vars: { "--bg": "#F5EBDD", "--bg2": "#EBD9C1", "--surface": "#FFF8EE", "--accent": "#A8441F", "--accent2": "#8A3B1E", "--text": "#3B2418", "--muted": "#6E5443",
      "--border": "rgba(192,86,47,0.32)", "--btn-bg": "#C0562F", "--btn-text": "#FFFFFF", "--radius": "10px", "--btn-radius": "999px" },
    fonts: { display: ["'Yatra One'", "serif"], title: ["'Yatra One'", "serif"], body: ["'Mukta'", "sans-serif"] },
    langFonts: { ur: UR },
    Intro: DoorIntro, Particles: DiyaRow, Frame: HearthFrame, Divider: HearthDivider,
  },
  boardroom: {
    id: "boardroom", eventTypes: ["corporate"], className: "tpl-board", sample: "Acme",
    fontsHref: `${GF}DM+Serif+Display&family=Manrope:wght@400;600;700`, defaultMusic: "none", particleMs: 1300,
    swatch: ["#0B1B33", "#16305A", "#7FA7E8", "#FFFFFF"],
    vars: { "--bg": "#0B1B33", "--bg2": "#12284A", "--surface": "#10233F", "--accent": "#9DBCF0", "--accent2": "#FFFFFF", "--text": "#E8EDF5", "--muted": "#B4C0D3",
      "--border": "rgba(255,255,255,0.18)", "--btn-bg": "#FFFFFF", "--btn-text": "#0B1B33", "--radius": "6px", "--btn-radius": "6px" },
    fonts: { display: ["'DM Serif Display'", "serif"], title: ["'Manrope'", "sans-serif"], body: ["'Manrope'", "sans-serif"] },
    langFonts: { hi: { family: "'Noto Sans Devanagari'", href: `${GF}Noto+Sans+Devanagari:wght@400;600` }, ur: UR },
    Intro: LineIntro, Particles: SoftFade, Frame: BoardFrame, Divider: BoardDivider,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);
export const getTemplate = (id) => TEMPLATES[id] || TEMPLATES["wedding-royal"];

// Builds CSS variables, inserting the card language's script font before the generic family.
export const themeVars = (tpl, lang, headingFont) => {
  const extra = tpl.langFonts?.[lang]?.family;
  const stack = ([family, generic]) => [family, extra, generic].filter(Boolean).join(", ");
  const h = HEADING_FONTS[headingFont];
  const heading = h && stack([h.family, h.generic]);
  return {
    ...tpl.vars,
    "--font-display": stack(tpl.fonts.display),
    "--font-title": stack(tpl.fonts.title),
    "--font-body": stack(tpl.fonts.body),
    "--font-heading": heading || stack(tpl.fonts.display),
    "--font-heading-title": heading || stack(tpl.fonts.title),
  };
};

export const loadFont = (id, href) => {
  if (!href || document.querySelector(`link[data-tpl-font="${id}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.tplFont = id;
  document.head.appendChild(link);
};

export const useTemplateFonts = (tpl, lang, headingFont) => {
  useEffect(() => {
    loadFont(tpl.id, tpl.fontsHref);
    loadFont(`${tpl.id}-${lang}`, tpl.langFonts?.[lang]?.href);
    loadFont(`heading-${headingFont}`, HEADING_FONTS[headingFont]?.href);
  }, [tpl, lang, headingFont]);
};
