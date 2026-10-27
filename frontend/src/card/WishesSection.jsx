import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { namesLine } from "@/lib/eventTime";
import { tCorp } from "@/i18n";
import { waLink } from "@/lib/links";
import { Reveal } from "./CardSections";
import { CardPhoto } from "./CardPhoto";

export const WishesSection = ({ card, event, guestName, guestId, t, preview }) => {
  const [name, setName] = useState(guestName);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setName(guestName), [guestName]);

  const text = t("whatsapp.wish", { message: message.trim(), guest: name.trim(), event: event.name, names: namesLine(card) });

  const send = (e) => {
    const err = !name.trim() ? t("guest.nameRequired") : !message.trim() ? t("guest.wishRequired") : "";
    setError(err);
    if (err) return e.preventDefault();
    setSent(name.trim());
    if (preview || !card.slug) return;
    api.post(`/public/cards/${card.slug}/wishes`, {
      guest_name: name.trim(), message: message.trim(), event_id: event.event_id, guest_id: guestId || "",
    }).catch(() => {});
  };

  return (
    <section className="gc-section" data-testid="card-wishes-section">
      <Reveal>
        <div className="gc-panel">
          <CardPhoto path={card.wishes_photo} fit={card.photo_fit?.wishes} variant="wishes" testId="card-wishes-photo" />
          <h2 className="gc-heading gc-center">{tCorp(t, card, "wishesTitle")}</h2>
          <p className="gc-muted gc-center">{tCorp(t, card, "wishesSubtitle")}</p>
          <label className="gc-label" htmlFor="wish-name">{t("guest.yourName")}</label>
          <input id="wish-name" className="gc-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} data-testid="wishes-name-input" />
          <p className="gc-label">{t("guest.suggestions")}</p>
          <div className="gc-suggestions">
            {t(`wishSuggestions.${card.event_type}`).map((s, i) => (
              <button key={s} type="button" onClick={() => setMessage(s)} className={`gc-suggestion ${message === s ? "is-active" : ""}`} data-testid={`wishes-suggestion-${i}`}>{s}</button>
            ))}
          </div>
          <label className="gc-label" htmlFor="wish-msg">{tCorp(t, card, "yourWish")}</label>
          <textarea id="wish-msg" className="gc-input gc-textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} data-testid="wishes-message-input" />
          {error && <p className="gc-error" role="alert" data-testid="wishes-error">{error}</p>}
          <a className="gc-btn gc-block gc-wish-btn" href={waLink(card.host_whatsapp, text)} target="_blank" rel="noreferrer" onClick={send} data-testid="wishes-whatsapp-button">
            <MessageCircle size={16} /> {tCorp(t, card, "sendWishes")}
          </a>
          {sent && <p className="gc-success" role="status" data-testid="wishes-success-message">{t("guest.wishThanks", { name: sent })}</p>}
        </div>
      </Reveal>
    </section>
  );
};
