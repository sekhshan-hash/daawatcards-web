export const cleanPhone = (raw = "") => {
  const plus = raw.trim().startsWith("+");
  let d = raw.replace(/\D/g, "");
  if (!plus && d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!plus && d.length === 10) d = `91${d}`;
  return d.length >= 8 && d.length <= 15 ? `+${d}` : "";
};

const digits = (s) => s.replace(/\D/g, "").length;
const PHONE_TAIL = /(\+?\d[\d\s().-]{6,}\d)\s*$/;
const HEADER = /^(name|names|guest|guests|full name)$/i;

const row = (name, phone) => {
  const n = (name || "").replace(/\s+/g, " ").trim().slice(0, 80);
  return n ? { name: n, phone: cleanPhone(phone || "") } : null;
};

export const parseLine = (line) => {
  const parts = line.split(/\t|,|;/).map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) {
    const m = line.match(PHONE_TAIL);
    if (m && digits(m[1]) >= 8) return row(line.slice(0, m.index).replace(/[-–:,]+\s*$/, ""), m[1]) || row(m[1], m[1]);
    return row(parts[0]);
  }
  const phone = parts.find((p) => digits(p) >= 8 && !/[a-z]/i.test(p)) || "";
  const name = parts.find((p) => p !== phone && /[^\d\s+().-]/.test(p)) || parts[0];
  return row(name, phone);
};

export const parseLines = (text) =>
  text.split(/\r?\n/).map(parseLine).filter((r) => r && !HEADER.test(r.name));

const splitCsv = (line) => {
  const out = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if ((ch === "," || ch === ";" || ch === "\t") && !q) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
};

export const parseCsv = (text) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = splitCsv(lines[0]).map((h) => h.toLowerCase());
  if (!head.some((h) => /name/.test(h))) return parseLines(lines.join("\n"));
  const find = (re) => head.findIndex((h) => re.test(h));
  const full = find(/^(name|full name|display name|guest|guest name)$/);
  const first = find(/first name|given name/);
  const last = find(/last name|family name|surname/);
  const phone = find(/phone|mobile|whatsapp|number|tel/);
  const nameAny = find(/name/);
  return lines.slice(1).map((l) => {
    const c = splitCsv(l);
    const name = full >= 0 ? c[full] : first >= 0 ? [c[first], c[last]].filter(Boolean).join(" ") : c[nameAny];
    return row(name, phone >= 0 ? c[phone] : "");
  }).filter(Boolean);
};

const decodeQP = (line, value) => {
  if (!/QUOTED-PRINTABLE/i.test(line)) return value;
  try {
    return decodeURIComponent(value.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, "%$1"));
  } catch {
    return value;
  }
};

const field = (block, re) => {
  const m = block.match(re);
  return m ? decodeQP(m[0], m[1]).replace(/\\,/g, ",").replace(/\\;/g, ";").trim() : "";
};

export const parseVcf = (text) =>
  text.split(/BEGIN:VCARD/i).slice(1).map((raw) => {
    const block = raw.replace(/\r?\n[ \t]/g, "").replace(/=\r?\n/g, "");
    const fn = field(block, /^FN[^:\n]*:(.*)$/im);
    const n = field(block, /^N[^:\n]*:(.*)$/im);
    const tel = field(block, /^(?:item\d+\.)?TEL[^:\n]*:(.*)$/im);
    const name = fn || n.split(";").slice(0, 2).reverse().join(" ").trim() || tel;
    return row(name, tel);
  }).filter(Boolean);

export const parseFile = async (file) => {
  const text = await file.text();
  return /\.vcf$/i.test(file.name) || /BEGIN:VCARD/i.test(text) ? parseVcf(text) : parseCsv(text);
};

export const supportsContacts = () => "contacts" in navigator && "ContactsManager" in window;

// Contact Picker results vary by browser: a property may be an array, a single string, or missing.
const firstValue = (v) => {
  if (Array.isArray(v)) return (v.find((x) => x && String(x).trim()) || "").toString();
  return v ? String(v) : "";
};

export const pickContacts = async () => {
  let props = ["name", "tel"];
  try {
    const supported = await navigator.contacts.getProperties();
    const want = props.filter((p) => supported.includes(p));
    if (want.length) props = want;
  } catch { /* fall back to requesting both */ }
  const list = await navigator.contacts.select(props, { multiple: true });
  return list
    .map((c) => row(firstValue(c.name) || firstValue(c.tel), firstValue(c.tel)))
    .filter(Boolean);
};
