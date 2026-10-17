import { BACKEND_URL, API } from "./api";

const query = (name, guestId) => {
  const p = new URLSearchParams();
  if (name?.trim()) p.set("to", name.trim());
  if (guestId) p.set("g", guestId);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const guestPath = (slug, eventId, name, guestId) => `/i/${slug}/${eventId}${query(name, guestId)}`;

// Share links go through the backend so WhatsApp gets per-event preview tags, then redirect to guestPath.
export const shareUrl = (slug, eventId, name, guestId) => `${BACKEND_URL}/api/s/${slug}/${eventId}${query(name, guestId)}`;

export const icsUrl = (slug, eventId) => `${API}/public/cards/${slug}/events/${eventId}/ics`;

export const waLink = (phone, text) => `https://wa.me/${(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  }
};
