import en from "./en";
import hi from "./hi";
import ur from "./ur";

// Guest-facing strings are translated; the host app uses English. Missing keys fall back to English.
const DICTS = { en, hi, ur };
const RTL = new Set(["ur"]);
export const LOCALES = { en: "en-IN", hi: "hi-IN", ur: "ur-IN" };
export const LANGUAGES = [{ code: "en", label: "English" }, { code: "hi", label: "हिन्दी" }, { code: "ur", label: "اردو" }];

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const makeT = (lang = "en") => (key, vars = {}) => {
  const s = get(DICTS[lang] || en, key) ?? get(en, key) ?? key;
  if (typeof s !== "string") return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
};

export const t = makeT("en");
export const dirFor = (lang) => (RTL.has(lang) ? "rtl" : "ltr");
