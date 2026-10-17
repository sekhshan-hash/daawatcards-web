import en from "./en";

// Add hi / ur dictionaries here in Phase 2; RTL languages are listed below.
const DICTS = { en };
const RTL = new Set(["ur"]);
export const LOCALES = { en: "en-IN" };
export const LANGUAGES = [{ code: "en", label: "English" }];

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const makeT = (lang = "en") => (key, vars = {}) => {
  const s = get(DICTS[lang] || en, key) ?? get(en, key) ?? key;
  if (typeof s !== "string") return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
};

export const t = makeT("en");
export const dirFor = (lang) => (RTL.has(lang) ? "rtl" : "ltr");
