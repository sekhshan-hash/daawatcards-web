import { useEffect, useState } from "react";
import { Check, MessageCircle, Minus, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { formatLongDate, namesLine } from "@/lib/eventTime";
import { waLink } from "@/lib/links";
import { Reveal } from "./CardSections";

const OPTIONS = [["yes", "rsvpYes"], ["maybe", "rsvpMaybe"], ["no", "rsvpNo"]];

export const RsvpSection = ({ card, event, guestName, t, preview }) => {
  const storeKey = `rsvp:${card.slug || "preview"}:${event.event_id}`;
  const [name, setName] = useState(guestName);
  const [status, setStatus] = useState("yes");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prev = JSON.parse(localStorage.getItem(storeKey) || "null");
    setSaved(prev);
    setError("");
    if (prev) {
      setStatus(prev.status);
      setGuests(prev.guests || 1);
    }
  }, [storeKey]);

  const submit = async () => {
    if (!name.trim()) return setError(t("guest.nameRequired"));
    setError("");
    if (preview || !card.slug) return setSaved({ guest_name: name, status, guests, preview: true });
    setBusy(true);
    try {
      const { data } = await api.post(`/public/cards/${card.slug}/events/${event.event_id}/rsvp`, { guest_name: name, status, guests, message });
      localStorage.setItem(storeKey, JSON.stringify(data));
      setSaved(data);
    } catch {
      setError(t("guest.rsvpError"));
    } finally {
      setBusy(false);
    }
  };

  const waText = t(`whatsapp.rsvp.${status}`, {
    guest: name.trim() || t("guest.specialGuest"), event: event.name, names: namesLine(card),
    date: formatLongDate(event.date, card.language), count: guests,
  });

  return (
    <section className="gc-section" data-testid="card-rsvp-section">
      <Reveal>
        <div className="gc-panel">
          <h2 className="gc-heading gc-center">{t("guest.rsvpTitle")}</h2>
          <p className="gc-muted gc-center">{t("guest.rsvpSubtitle")}</p>
          <div className="gc-rsvp-options" role="radiogroup">
            {OPTIONS.map(([key, label]) => (
              <button key={key} type="button" role="radio" aria-checked={status === key} onClick={() => setStatus(key)}
                className={`gc-option ${status === key ? "is-active" : ""}`} data-testid={`rsvp-${key}-button`}>
                {status === key && <Check size={15} />} {t(`guest.${label}`)}
              </button>
            ))}
          </div>
          <label className="gc-label" htmlFor="rsvp-name">{t("guest.yourName")}</label>
          <input id="rsvp-name" className="gc-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} data-testid="rsvp-name-input" />
          {status !== "no" && (
            <div className="gc-stepper-row">
              <span className="gc-label">{t("guest.guestsCount")}</span>
              <div className="gc-stepper">
                <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="-" data-testid="rsvp-guests-decrement"><Minus size={16} /></button>
                <span data-testid="rsvp-guests-count">{guests}</span>
                <button type="button" onClick={() => setGuests((g) => Math.min(20, g + 1))} aria-label="+" data-testid="rsvp-guests-increment"><Plus size={16} /></button>
              </div>
            </div>
          )}
          <label className="gc-label" htmlFor="rsvp-msg">{t("guest.message")}</label>
          <textarea id="rsvp-msg" className="gc-input gc-textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} data-testid="rsvp-message-input" />
          {error && <p className="gc-error" role="alert" data-testid="rsvp-error">{error}</p>}
          <button type="button" className="gc-btn gc-block" onClick={submit} disabled={busy} data-testid="rsvp-submit-button">
            {saved ? t("guest.updateRsvp") : t("guest.submitRsvp")}
          </button>
          {saved && (
            <p className="gc-success" role="status" data-testid="rsvp-success-message">
              {saved.preview ? t("guest.rsvpPreview") : t("guest.rsvpSaved", { name: saved.guest_name })}
            </p>
          )}
          <p className="gc-or"><span>{t("guest.or")}</span></p>
          <a className="gc-btn gc-btn-ghost gc-block" href={waLink(card.host_whatsapp, waText)} target="_blank" rel="noreferrer" data-testid="rsvp-whatsapp-button">
            <MessageCircle size={16} /> {t("guest.whatsappRsvp")}
          </a>
        </div>
      </Reveal>
    </section>
  );
};
