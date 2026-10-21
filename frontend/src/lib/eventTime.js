import { LOCALES } from "@/i18n";

const enc = encodeURIComponent;
const locale = (lang) => LOCALES[lang] || "en-IN";

const parseDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const formatLongDate = (date, lang) =>
  parseDate(date)?.toLocaleDateString(locale(lang), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) || "";

export const formatShortDate = (date, lang) =>
  parseDate(date)?.toLocaleDateString(locale(lang), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) || "";

export const formatTime = (time, lang) => {
  if (!/^\d{2}:\d{2}$/.test(time || "")) return "";
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString(locale(lang), { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
};

export const eventStartMs = (ev, tz = "+05:30") => Date.parse(`${ev.date}T${ev.time}:00${tz}`);

export const eventEndMs = (ev, tz = "+05:30") => {
  const start = eventStartMs(ev, tz);
  if (!ev.end_time) return start + 3 * 3600e3;
  let end = Date.parse(`${ev.date}T${ev.end_time}:00${tz}`);
  if (end <= start) end += 24 * 3600e3;
  return end;
};

export const namesLine = (card) =>
  ["wedding", "engagement"].includes(card.event_type) && card.secondary_name ? `${card.primary_name} & ${card.secondary_name}` : card.primary_name;

const gcalStamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const venueLine = (ev) => [ev.venue_name, ev.venue_address].filter(Boolean).join(", ");

export const googleCalendarUrl = (card, ev) => {
  const s = eventStartMs(ev, card.timezone);
  if (Number.isNaN(s)) return "";
  const e = eventEndMs(ev, card.timezone);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(`${ev.name} - ${namesLine(card)}`)}&dates=${gcalStamp(s)}/${gcalStamp(e)}&details=${enc(card.title || "")}&location=${enc(venueLine(ev))}`;
};

export const directionsUrl = (ev) =>
  ev.map_link || `https://www.google.com/maps/search/?api=1&query=${enc(venueLine(ev) || ev.name)}`;
