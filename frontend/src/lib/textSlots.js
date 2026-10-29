import { blessingText, makeT } from "@/i18n";
import { autoIntroTitle, defaultWording, eventClosing, eventDua, introTitle } from "@/i18n/traditions";
import { sortEvents } from "@/lib/eventTime";

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

// Exactly one invitation paragraph: the host's message, otherwise the tradition's default.
export const invitationParagraph = (card) => {
  if (card.invitation_text?.trim()) return card.invitation_text.trim();
  const ev = mainEvent(card);
  return ev ? (ev.wording?.trim() || defaultWording(card, { ...ev, name: occasionName(card) })) : "";
};

export const closingText = (card) => {
  const ev = mainEvent(card);
  return ev ? eventClosing(card, ev) : "";
};

export const cardDua = (card) => {
  const ev = mainEvent(card);
  return ev ? eventDua(card, ev) : null;
};

export const welcomeHeading = (card) => {
  const names = [card.primary_name, card.secondary_name].filter(Boolean).join(" & ");
  return `Welcome to the ${occasionName(card)} of ${names}`;
};

// Phrases that may appear in only one text slot per card.
export const KEY_PHRASES = ["mean the world to us", "means the world to us", "cordially invite", "your presence", "gracious presence",
  "request the pleasure", "joyfully invite", "warmly invite", "your company", "your blessings", "thank you for being", "join us"];

const sentences = (s) => (s || "").toLowerCase().split(/[.!?।۔\n]+/).map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.length > 12);

export const cardSlots = (card, t) => {
  const multi = (card.events || []).length > 1;
  return [
    { key: "intro", label: "Intro title", page: "Intro screen", text: introTitle(card) || autoIntroTitle(card) },
    { key: "welcome", label: "Welcome note", page: "Welcome screen", text: card.welcome_text?.trim() || "" },
    { key: "invitation", label: "Invitation message", page: multi ? "Cover" : "Card, under the names", text: invitationParagraph(card),
      note: card.invitation_text?.trim() ? "" : "Tradition default (fill Invitation message to replace it)" },
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
