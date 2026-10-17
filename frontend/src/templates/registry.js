import { useEffect } from "react";
import { RoyalIntro } from "./royal/RoyalIntro";
import { RoyalFrame, RoyalDivider, Petals } from "./royal/RoyalArt";
import { BalloonIntro } from "./birthday/BalloonIntro";
import { BirthdayFrame, BirthdayDivider, Confetti, renderPlayfulName } from "./birthday/BirthdayArt";

// Each template = theme config (CSS variables, fonts, music) + its own intro, particles and ornaments.
// Add a new template by creating its components and registering an entry here.
export const TEMPLATES = {
  "wedding-royal": {
    id: "wedding-royal",
    eventTypes: ["wedding"],
    className: "tpl-royal",
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
    className: "tpl-bday",
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
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);
export const getTemplate = (id) => TEMPLATES[id] || TEMPLATES["wedding-royal"];

// Builds CSS variables, inserting the card language's script font before the generic family.
export const themeVars = (tpl, lang) => {
  const extra = tpl.langFonts?.[lang]?.family;
  const stack = ([family, generic]) => [family, extra, generic].filter(Boolean).join(", ");
  return {
    ...tpl.vars,
    "--font-display": stack(tpl.fonts.display),
    "--font-title": stack(tpl.fonts.title),
    "--font-body": stack(tpl.fonts.body),
  };
};

const loadFont = (id, href) => {
  if (!href || document.querySelector(`link[data-tpl-font="${id}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.tplFont = id;
  document.head.appendChild(link);
};

export const useTemplateFonts = (tpl, lang) => {
  useEffect(() => {
    loadFont(tpl.id, tpl.fontsHref);
    loadFont(`${tpl.id}-${lang}`, tpl.langFonts?.[lang]?.href);
  }, [tpl, lang]);
};
