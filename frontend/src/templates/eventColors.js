// Per-event colour schemes. Each tone: [bg, bg2, surface, accent, accent2, text, muted, border, btnBg, btnText].
// Keep ids and hex values in sync with backend/og_image.py SCHEMES.
export const SCHEMES = {
  emerald: {
    dark: ["#0B2A1E", "#134232", "#0F3426", "#D9B44A", "#A7D7A0", "#F2F7EE", "rgba(242,247,238,0.78)", "rgba(217,180,74,0.42)", "#D9B44A", "#0B2A1E"],
    light: ["#EEF6E9", "#DCEBD3", "#FFFFFF", "#2F6B3F", "#1E4D2B", "#1F3324", "#4D6653", "rgba(47,107,63,0.3)", "#2F6B3F", "#FFFFFF"],
  },
  marigold: {
    dark: ["#3A2405", "#5A3A08", "#46300A", "#FFC93C", "#FFE7A3", "#FFF8E6", "rgba(255,248,230,0.8)", "rgba(255,201,60,0.42)", "#FFC93C", "#3A2405"],
    light: ["#FFF6D6", "#FFE89A", "#FFFCEF", "#9A6400", "#7A4D00", "#3D2A05", "#6E5520", "rgba(179,116,0,0.3)", "#E0A100", "#3D2A05"],
  },
  magenta: {
    dark: ["#2E0626", "#4D0D40", "#3A0931", "#FF5FB8", "#FFC2E5", "#FFF0F8", "rgba(255,240,248,0.8)", "rgba(255,95,184,0.42)", "#FF5FB8", "#2E0626"],
    light: ["#FDEAF4", "#F8CFE5", "#FFF7FB", "#B0136E", "#860F55", "#3F0A2B", "#74405E", "rgba(176,19,110,0.28)", "#B0136E", "#FFFFFF"],
  },
  midnight: {
    dark: ["#0A1230", "#14204D", "#0F1A3D", "#E3C77A", "#AFC3FF", "#EEF2FF", "rgba(238,242,255,0.78)", "rgba(227,199,122,0.4)", "#E3C77A", "#0A1230"],
    light: ["#E9EEFB", "#D3DCF5", "#FFFFFF", "#22336E", "#15224F", "#141D3D", "#4A5577", "rgba(34,51,110,0.28)", "#22336E", "#FFFFFF"],
  },
  crimson: {
    dark: ["#3A0A10", "#5C1019", "#470C14", "#F2C14E", "#FFDDA1", "#FFF5EC", "rgba(255,245,236,0.8)", "rgba(242,193,78,0.42)", "#F2C14E", "#3A0A10"],
    light: ["#FBEDEA", "#F3D3CC", "#FFF9F7", "#9B1C2C", "#73121F", "#3A0D13", "#6E3F45", "rgba(155,28,44,0.28)", "#9B1C2C", "#FFFFFF"],
  },
  peacock: {
    dark: ["#06282D", "#0C3F47", "#093238", "#E8C766", "#7FD6D0", "#EFFAF9", "rgba(239,250,249,0.78)", "rgba(127,214,208,0.4)", "#E8C766", "#06282D"],
    light: ["#E6F5F4", "#C9EAE7", "#FFFFFF", "#0E6E73", "#0A5054", "#0F2E30", "#46666A", "rgba(14,110,115,0.28)", "#0E6E73", "#FFFFFF"],
  },
  coral: {
    dark: ["#33140E", "#552218", "#401A12", "#FF9A76", "#FFD3BF", "#FFF4EF", "rgba(255,244,239,0.8)", "rgba(255,154,118,0.42)", "#FF9A76", "#33140E"],
    light: ["#FFF0EA", "#FFD9C9", "#FFFAF7", "#B5482A", "#93391D", "#3E1A10", "#74483B", "rgba(194,80,44,0.28)", "#C2502C", "#FFFFFF"],
  },
  lavender: {
    dark: ["#1E1636", "#2F2456", "#261C45", "#C9B6FF", "#F0E8FF", "#F6F2FF", "rgba(246,242,255,0.78)", "rgba(201,182,255,0.4)", "#C9B6FF", "#1E1636"],
    light: ["#F2EEFB", "#E2D9F6", "#FFFFFF", "#6A4FB3", "#4D378A", "#2A2045", "#5E5578", "rgba(106,79,179,0.28)", "#6A4FB3", "#FFFFFF"],
  },
  champagne: {
    dark: ["#2A2418", "#3F3624", "#332C1E", "#E9D29A", "#FFF3D1", "#FBF7EC", "rgba(251,247,236,0.78)", "rgba(233,210,154,0.4)", "#E9D29A", "#2A2418"],
    light: ["#FBF7EE", "#F1E8D3", "#FFFFFF", "#8C6A2A", "#6B4F1C", "#2E2615", "#5F5440", "rgba(140,106,42,0.3)", "#8C6A2A", "#FFFFFF"],
  },
  blush: {
    dark: ["#2E1219", "#4A1E29", "#3A1720", "#F7B2C4", "#FFE0E8", "#FFF3F6", "rgba(255,243,246,0.8)", "rgba(247,178,196,0.4)", "#F7B2C4", "#2E1219"],
    light: ["#FDEFF2", "#F8D9E0", "#FFF9FA", "#B04A66", "#8A3550", "#3F1B25", "#74505A", "rgba(176,74,102,0.28)", "#B04A66", "#FFFFFF"],
  },
};
export const SCHEME_IDS = Object.keys(SCHEMES);

const AUTO = [
  ["emerald", /meh[ae]?ndi|henna|मेहंदी|मेहन्दी|मेंहदी|مہندی|مهندی/i],
  ["marigold", /haldi|ubtan|pithi|may[ou]n|हल्दी|हलदी|ہلدی|هلدی|مایوں/i],
  ["magenta", /sang[ei]{1,2}t|dholki|संगीत|ढोलकी|سنگیت|ڈھولکی/i],
  ["midnight", /wal[ei]ma|valima|reception|वलीमा|वलिमा|रिसेप्शन|ولیمہ|ولیمه|استقبالیہ|ریسیپشن/i],
];

export const autoScheme = (name = "") => AUTO.find(([, re]) => re.test(name))?.[0] || "template";

// Returns a scheme id or "template" for an event; single-event cards always use the template.
export const eventScheme = (card, ev) => {
  if (!ev || card.events.length < 2) return "template";
  if (ev.color === "template" || SCHEMES[ev.color]) return ev.color;
  return autoScheme(ev.name);
};

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
export const toneOf = (tpl) => (lum(tpl.vars["--bg"]) < 0.5 ? "dark" : "light");

const KEYS = ["--bg", "--bg2", "--surface", "--accent", "--accent2", "--text", "--muted", "--border", "--btn-bg", "--btn-text"];
export const schemeVars = (tpl, id) => {
  const s = SCHEMES[id]?.[toneOf(tpl)];
  return s ? Object.fromEntries(KEYS.map((k, i) => [k, s[i]])) : {};
};

// Moves colour vars to their animatable --c-* names (see templates.css).
export const colorVars = (vars) => Object.fromEntries(Object.entries(vars).map(([k, v]) => [KEYS.includes(k) ? `--c-${k.slice(2)}` : k, v]));

const DOTS = { emerald: "#2E9B5A", marigold: "#F2B90F", magenta: "#D6249A", midnight: "#3A52C4", crimson: "#C0283A", peacock: "#13979A", coral: "#F26B4A", lavender: "#9479E0", champagne: "#D8BE7E", blush: "#F08AA6" };
export const schemeDot = (tpl, id) => DOTS[id] || tpl.vars["--accent"];
export const schemeSwatch = (tpl, id) => {
  const s = SCHEMES[id]?.[toneOf(tpl)];
  return s ? [s[0], s[3]] : [tpl.vars["--bg"], tpl.vars["--accent"]];
};
