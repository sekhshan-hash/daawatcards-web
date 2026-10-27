import { useEffect, useState } from "react";
import { Check, Minus, Plus, Send } from "lucide-react";
import { api } from "@/lib/api";
import { namesLine } from "@/lib/eventTime";
import { waLink } from "@/lib/links";
import { Reveal } from "./CardSections";

export const RsvpSection = ({ card, guestName, guestId, t, preview }) => {
  const [name, setName] = useState(guestName);
  const [attending, setAttending] = useState(null);
  const [count, setCount] = useState(1);
  const [picked, setPicked] = useState(card.events.map((e) => e.event_id));
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  useEffect(() => setName(guestName), [guestName]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : [...p, id]));
  const evNames = card.events.filter((e) => picked.includes(e.event_id)).map((e) => e.name).join(", ");
  const text = attending
    ? t(count === 1 ? "whatsapp.rsvpYesOne" : "whatsapp.rsvpYes", { guest: name.trim(), count, events: evNames, names: namesLine(card) })
    : t("whatsapp.rsvpNo", { guest: name.trim(), names: namesLine(card) });

  const send = (e) => {
    const err = !name.trim() ? t("guest.nameRequired") : attending === null ? t("guest.rsvpChoose") : "";
    setError(err);
    if (err) return e.preventDefault();
    if (preview || !card.slug) return setSent(name.trim());
    const who = name.trim();
    api.post(`/public/cards/${card.slug}/rsvp`, {
      guest_name: who, guest_id: guestId || "", attending, count: attending ? count : 0, event_ids: attending ? picked : [],
    }).then(() => setSent(who)).catch(() => setError(t("guest.rsvpFailed")));
  };

  return (
    <section className="gc-section" data-testid="card-rsvp-section">
      <Reveal>
        <div className="gc-panel">
          <h2 className="gc-heading gc-center">{t("guest.rsvpTitle")}</h2>
          <p className="gc-muted gc-center">{t("guest.rsvpSubtitle")}</p>
          <label className="gc-label" htmlFor="rsvp-name">{t("guest.yourName")}</label>
          <input id="rsvp-name" className="gc-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} data-testid="rsvp-name-input" />
          <div className="gc-rsvp-choice">
            {[true, false].map((v) => (
              <button key={String(v)} type="button" onClick={() => setAttending(v)} className={`gc-suggestion ${attending === v ? "is-active" : ""}`} data-testid={v ? "rsvp-accept-button" : "rsvp-decline-button"}>
                {attending === v && <Check size={14} />} {v ? t("guest.rsvpYes") : t("guest.rsvpNo")}
              </button>
            ))}
          </div>
          {attending && (
            <>
              <p className="gc-label">{t("guest.rsvpCount")}</p>
              <div className="gc-stepper">
                <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="-" data-testid="rsvp-count-minus"><Minus size={16} /></button>
                <span data-testid="rsvp-count-value">{count}</span>
                <button type="button" onClick={() => setCount((c) => Math.min(50, c + 1))} aria-label="+" data-testid="rsvp-count-plus"><Plus size={16} /></button>
              </div>
              {card.events.length > 1 && (
                <>
                  <p className="gc-label">{t("guest.rsvpEvents")}</p>
                  <div className="gc-suggestions">
                    {card.events.map((ev) => (
                      <button key={ev.event_id} type="button" onClick={() => toggle(ev.event_id)} className={`gc-suggestion ${picked.includes(ev.event_id) ? "is-active" : ""}`} data-testid={`rsvp-event-${ev.event_id}`}>{ev.name}</button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {error && <p className="gc-error" role="alert" data-testid="rsvp-error">{error}</p>}
          <a className="gc-btn gc-block gc-wish-btn" href={waLink(card.host_whatsapp, text)} target="_blank" rel="noreferrer" onClick={send} data-testid="rsvp-whatsapp-button">
            <Send size={16} /> {t("guest.rsvpSend")}
          </a>
          {sent && <p className="gc-success" role="status" data-testid="rsvp-success-message">{t("guest.rsvpThanks", { name: sent })}</p>}
        </div>
      </Reveal>
    </section>
  );
};
