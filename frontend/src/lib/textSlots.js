import { COUPLE_TYPES, blessingText, makeT } from "@/i18n";
import { autoIntroTitle, eventClosing, eventDua, familyText, introTitle,
  welcomeGreetingDefault, welcomeSalutationDefault } from "@/i18n/traditions";
import { formatDate, sortEvents } from "@/lib/eventTime";

const TYPE_NAMES = { wedding: "Wedding", engagement: "Engagement", birthday: "Birthday", aqiqah: "Aqiqah Ceremony", babyShower: "Baby Shower", housewarming: "Housewarming", corporate: "Event" };

// Single source for the occasion name: one event -> its name; several -> the occasion type.
export const occasionName = (card) => {
  const evs = card.events || [];
  const name = evs.length === 1 ? (evs[0].name || "").trim() : "";
  if (/^aqiqah$/i.test(name)) return "Aqiqah Ceremony";
  return name || TYPE_NAMES[card.event_type] || "Celebration";
};

export const mainEvent = (card) => sortEvents(card.events, card.timezone)[0];

// Card title shown on the cover: the host's own title, otherwise the occasion name (old untouched default titles count as unset).
export const displayTitle = (card) => {
  const title = card.title?.trim() || "";
  const defaults = ["en", "hi", "ur"].map((l) => makeT(l)(`defaults.${card.event_type}.title`));
  return !title || defaults.includes(title) ? occasionName(card) : title;
};

const multiEvent = (card) => (card.events || []).length > 1;

// Exactly one invitation paragraph: the host's own message, or nothing when left blank (no hidden fallback).
export const invitationParagraph = (card) => (card.invitation_text?.trim() || "");

export const welcomeNames = (card) => (COUPLE_TYPES.includes(card.event_type) && card.secondary_name
  ? `${card.primary_name} & ${card.secondary_name}` : card.primary_name);

// Raw templates (tokens kept) for rich rendering on the card.
export const welcomeSalutationRaw = (card) => card.welcome_salutation ?? welcomeSalutationDefault(card);
export const welcomeGreetingRaw = (card) => card.welcome_greeting ?? welcomeGreetingDefault(card);
export const occasionValue = (card) => occasionName(card);
export const namesValue = (card) => welcomeNames(card);

const fillTokens = (text, card) => (text || "").replace(/\{occasion\}/g, occasionName(card)).replace(/\{names\}/g, welcomeNames(card));
// Welcome greeting lines: fall back to the tradition default only when the field was never set.
export const welcomeSalutation = (card) => fillTokens(card.welcome_salutation ?? welcomeSalutationDefault(card), card);
export const welcomeGreeting = (card) => fillTokens(card.welcome_greeting ?? welcomeGreetingDefault(card), card);
// Welcome note raw template (tokens kept). An old literal "welcome note" counts as empty.
export const welcomeNoteRaw = (card) => {
  const raw = (card.welcome_text ?? "").trim();
  return raw.toLowerCase() === "welcome note" ? "" : raw;
};
// Welcome note for display: occasion/names filled, {date} replaced with the first event's date.
export const welcomeNoteText = (card) => {
  const raw = welcomeNoteRaw(card);
  if (!raw) return "";
  return fillTokens(raw, card).replace(/\{date\}/g, formatDate(mainEvent(card)?.date, card.language) || "—");
};

export const closingText = (card) => {
  const ev = mainEvent(card);
  if (!ev) return "";
  return eventClosing(card, multiEvent(card) ? { ...ev, closing: null } : ev);
};

export const cardDua = (card) => {
  if (multiEvent(card)) return (card.events || []).map((e) => eventDua(card, { ...e, dua: null })).find(Boolean) || null;
  const ev = mainEvent(card);
  return ev ? eventDua(card, ev) : null;
};

export const welcomeHeading = (card) => `Welcome to the ${occasionName(card)} of ${welcomeNames(card)}`;

// Phrases that may appear in only one text slot per card.
export const KEY_PHRASES = ["mean the world to us", "means the world to us", "cordially invite", "your presence", "gracious presence",
  "request the pleasure", "request the honour", "joyfully invite", "warmly invite", "your company", "your blessings", "blessings of",
  "share in our joy", "thank you for being", "join us"];

const sentences = (s) => (s || "").toLowerCase().split(/[.!?।۔\n]+/).map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.length > 12);

const welcomeGreetingSlot = (card) => [welcomeSalutation(card), welcomeGreeting(card)].filter(Boolean).join(" · ");

export const cardSlots = (card, t) => {
  const multi = (card.events || []).length > 1;
  const invite = invitationParagraph(card);
  return [
    { key: "intro", label: "Intro title", page: "Intro screen", text: introTitle(card) || autoIntroTitle(card) },
    { key: "welcomeGreeting", label: "Welcome greeting", page: "Welcome screen", text: welcomeGreetingSlot(card) },
    { key: "welcome", label: "Welcome note", page: "Welcome screen", text: welcomeNoteText(card) },
    { key: "family", label: "Family line", page: "Cover, above the names", text: familyText(card) },
    { key: "invitation", label: "Invitation message", page: multi ? "Cover" : "Card, under the names", text: invite,
      note: invite ? "" : "Leave empty to show nothing" },
    { key: "blessing", label: "Blessing", page: multi ? "Cover, below the invitation" : "Below the invitation", text: blessingText(t, card) || "" },
    { key: "closing", label: "Closing line", page: "End of the card", text: closingText(card) },
  ];
};

// { slotKey: otherSlotLabel } when two slots share a sentence or a key phrase.
export const slotOverlaps = (slots) => {
  const out = {};
  slots.forEach((a, i) => slots.forEach((b, j) => {
    if (i === j || out[a.key] || !a.text || !b.text) return;
    const la = a.text.toLowerCase();
    const lb = b.text.toLowerCase();
    const sb = new Set(sentences(b.text));
    if (sentences(a.text).some((s) => sb.has(s)) || KEY_PHRASES.some((p) => la.includes(p) && lb.includes(p))) out[a.key] = b.label;
  }));
  return out;
};
