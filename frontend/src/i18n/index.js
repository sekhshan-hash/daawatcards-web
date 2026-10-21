import en from "./en";
import hi from "./hi";
import ur from "./ur";
import enMore from "./en_more";
import hiMore from "./hi_more";
import urMore from "./ur_more";

const merge = (a, b) => {
  const out = { ...a };
  Object.entries(b).forEach(([k, v]) => {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? merge(a[k], v) : v;
  });
  return out;
};

// Guest-facing strings are translated; the host app uses English. Missing keys fall back to English.
const DICTS = { en: merge(en, enMore), hi: merge(hi, hiMore), ur: merge(ur, urMore) };
const RTL = new Set(["ur"]);
export const LOCALES = { en: "en-IN", hi: "hi-IN", ur: "ur-IN-u-nu-latn" };
export const LANGUAGES = [{ code: "en", label: "English" }, { code: "hi", label: "हिन्दी" }, { code: "ur", label: "اردو" }];

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const makeT = (lang = "en") => (key, vars = {}) => {
  const s = get(DICTS[lang] || DICTS.en, key) ?? get(DICTS.en, key) ?? key;
  if (typeof s !== "string") return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
};

export const t = makeT("en");
export const dirFor = (lang) => (RTL.has(lang) ? "rtl" : "ltr");

export const COUPLE_TYPES = ["wedding", "engagement"];

export const blessingText = (t, card) => {
  const key = card.blessing_key;
  if (key === "custom") return card.blessing_text;
  if (key === "none") return "";
  const typed = t(`blessingsByType.${card.event_type}.${key}`);
  return typeof typed === "string" && !typed.startsWith("blessingsByType.") ? typed : t(`blessings.${key}`);
};

export const tCorp = (t, card, key) => (card.event_type === "corporate" ? t(`guest.corporate.${key}`) : t(`guest.${key}`));
