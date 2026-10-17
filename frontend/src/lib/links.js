import { BACKEND_URL, API } from "./api";

const query = (name) => (name?.trim() ? `?${new URLSearchParams({ to: name.trim() })}` : "");

export const guestPath = (slug, eventId, name) => `/i/${slug}/${eventId}${query(name)}`;

// Share links go through the backend so WhatsApp gets per-event preview tags, then redirect to guestPath.
export const shareUrl = (slug, eventId, name) => `${BACKEND_URL}/api/s/${slug}/${eventId}${query(name)}`;

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
