import { useEffect } from "react";
import { loadFont } from "@/templates/registry";

// Detect the dominant non-Latin script of some text so we can load a fitting font.
const RANGES = [
  ["arabic", /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/],
  ["deva", /[\u0900-\u097F]/],
  ["guru", /[\u0A00-\u0A7F]/],
  ["gujarati", /[\u0A80-\u0AFF]/],
  ["bengali", /[\u0980-\u09FF]/],
  ["tamil", /[\u0B80-\u0BFF]/],
  ["telugu", /[\u0C00-\u0C7F]/],
];

export const detectScript = (text) => {
  const s = text || "";
  for (const [name, re] of RANGES) if (re.test(s)) return name;
  return "latin";
};

export const RTL_SCRIPTS = new Set(["arabic"]);

// Each script maps to a font stack (always has a system fallback) and the Google Fonts URL loaded on demand.
export const SCRIPT_FONT = {
  arabic: { stack: "'Noto Naskh Arabic', 'Amiri', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600&display=swap" },
  deva: { stack: "'Noto Serif Devanagari', 'Tiro Devanagari Hindi', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600&display=swap" },
  guru: { stack: "'Noto Sans Gurmukhi', sans-serif", url: "https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;600&display=swap" },
  gujarati: { stack: "'Noto Serif Gujarati', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Serif+Gujarati:wght@400;600&display=swap" },
  bengali: { stack: "'Noto Serif Bengali', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600&display=swap" },
  tamil: { stack: "'Noto Serif Tamil', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;600&display=swap" },
  telugu: { stack: "'Noto Serif Telugu', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Serif+Telugu:wght@400;600&display=swap" },
};

// Returns the direction + font family for a piece of host text, loading the webfont when it is non-Latin.
export const useScriptFont = (text) => {
  const script = detectScript(text);
  const font = SCRIPT_FONT[script];
  useEffect(() => {
    if (font) loadFont(`script-${script}`, font.url);
  }, [script, font]);
  return { script, dir: RTL_SCRIPTS.has(script) ? "rtl" : undefined, fontFamily: font?.stack };
};
