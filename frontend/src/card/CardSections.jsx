import { useEffect, useState } from "react";
import { CalendarPlus, ChevronDown, Clock, MapPin, Navigation, RotateCcw, Shirt, CalendarDays } from "lucide-react";
import { BRAND } from "@/config/brand";
import { COUPLE_TYPES, blessingText, tCorp } from "@/i18n";
import { useInView } from "@/hooks/useMedia";
import { directionsUrl, eventStartMs, eventStatus, formatLongDate, formatShortDate, formatTime, googleCalendarUrl, namesLine } from "@/lib/eventTime";
import { icsUrl } from "@/lib/links";
import { eventConcluded, familyText } from "@/i18n/traditions";
import { CardPhoto } from "./CardPhoto";
import { FitText } from "./FitText";
import { ClosingLine, EventDua, EventWording, FamilyBlock, HeaderLine } from "./Wording";

export const Reveal = ({ children, className = "" }) => {
  const [ref, inView] = useInView();
  return <div ref={ref} className={`gc-reveal ${inView ? "is-in" : ""} ${className}`}>{children}</div>;
};



export const TitleSection = ({ card, event, t, tpl, single, cover = false, events = [], onJump }) => {
  const couple = COUPLE_TYPES.includes(card.event_type) && card.secondary_name;
  const Frame = tpl.Frame;
  const Divider = tpl.Divider;
  return (
    <section className={`gc-title-screen ${single ? "is-single" : ""} ${cover ? "is-cover" : ""} ${card.photos?.[0] ? "has-photo" : ""}`} data-testid="card-title-section">
      <Frame />
      <HeaderLine card={card} testId="card-cover-header-line" />
      <CardPhoto path={card.photos?.[0]} variant="hero" testId="card-hero-photo" />
      <FamilyBlock card={card} />
      {!familyText(card) && <p className="gc-eyebrow">{t(`guest.eyebrow.${card.event_type}`)}</p>}
      {couple ? (
        <FitText as="h1" className="gc-names is-couple" data-testid="card-names">
          {card.primary_name} <span className="gc-amp">&amp;</span> {card.secondary_name}
        </FitText>
      ) : (
        <>
          <FitText as="h1" className="gc-names" data-testid="card-names">{tpl.renderName ? tpl.renderName(card.primary_name) : card.primary_name}</FitText>
          {card.secondary_name && <p className="gc-subname">{card.secondary_name}</p>}
        </>
      )}
      <Divider />
      {card.title && <p className="gc-title" data-testid="card-event-title">{card.title}</p>}
      {cover ? (
        <ul className="gc-cover-events" data-testid="cover-events-list">
          {events.map((ev, i) => (
            <li key={ev.event_id}>
              <button type="button" onClick={() => onJump(i + 1)} data-testid={`cover-event-${ev.event_id}`}>
                <span className="gc-cover-event-name">{ev.name}</span>
                <span className="gc-cover-event-date">{formatShortDate(ev.date, card.language)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="gc-chip" data-testid="card-title-event-chip">{event.name}{event.date ? ` · ${formatShortDate(event.date, card.language)}` : ""}</p>
          <div className="gc-scroll-cue"><span>{t("guest.scroll")}</span><ChevronDown size={18} /></div>
        </>
      )}
    </section>
  );
};

const blessingFor = (card, t) => blessingText(t, card);

const Row = ({ icon: Icon, label, value, testId }) => (
  <div className="gc-row">
    <Icon size={18} className="gc-row-icon" />
    <div><p className="gc-row-label">{label}</p><p className="gc-row-value" data-testid={testId}>{value}</p></div>
  </div>
);

export const DetailsSection = ({ card, event, t, page = false }) => {
  const blessing = blessingFor(card, t);
  const time = [formatTime(event.time, card.language), formatTime(event.end_time, card.language)].filter(Boolean).join(" – ");
  return (
    <section className="gc-section" data-testid="card-details-section">
      {page && <HeaderLine card={card} ev={event} testId="card-event-header-line" />}
      {!page && card.invitation_text && <Reveal><p className="gc-invite" data-testid="card-invitation-text">{card.invitation_text}</p></Reveal>}
      {!page && card.photos?.[1] && <Reveal><CardPhoto path={card.photos[1]} variant="feature" testId="card-feature-photo" /></Reveal>}
      {!page && blessing && <Reveal><blockquote className="gc-blessing" data-testid="card-blessing">{blessing}</blockquote></Reveal>}
      <Reveal><EventWording card={card} ev={event} /></Reveal>
      <Reveal>
        <div className="gc-panel">
          <CardPhoto path={event.photo} variant="event" testId="card-event-photo" />
          <p className="gc-eyebrow">{t("guest.eventLabel")}</p>
          <h2 className="gc-heading" data-testid="card-event-name">{event.name}</h2>
          <div className="gc-rows">
            <Row icon={CalendarDays} label={t("guest.date")} value={formatLongDate(event.date, card.language) || "—"} testId="card-event-date" />
            <Row icon={Clock} label={t("guest.time")} value={time || "—"} testId="card-event-time" />
            {event.dress_code && <Row icon={Shirt} label={t("guest.dressCode")} value={event.dress_code} testId="card-event-dress-code" />}
          </div>
          {event.custom_text && <p className="gc-note" data-testid="card-event-custom-text">{event.custom_text}</p>}
        </div>
      </Reveal>
    </section>
  );
};

const split = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
};

const useNow = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

export const CountdownSection = ({ card, event, t }) => {
  const now = useNow();
  const target = eventStartMs(event, card.timezone);
  const valid = !Number.isNaN(target);
  const status = eventStatus(event, card.timezone, now);
  const parts = split(valid ? target - now : 0);
  const labels = [t("guest.days"), t("guest.hours"), t("guest.minutes"), t("guest.seconds")];
  if (status === "live" || status === "over") {
    return (
      <section className="gc-section gc-center" data-testid="card-countdown">
        <Reveal>
          <p className={`gc-heading gc-started ${status === "live" ? "is-live" : ""}`} data-testid={status === "live" ? "event-happening-now" : "event-concluded"}>
            {status === "live" ? t("guest.happeningNow") : t("guest.concluded")}
          </p>
          {status === "over" && eventConcluded(card, event) && <p className="gc-muted gc-concluded-msg" dir="auto" data-testid="event-concluded-message">{eventConcluded(card, event)}</p>}
        </Reveal>
      </section>
    );
  }
  return (
    <section className="gc-section gc-center" data-testid="card-countdown">
      <Reveal>
        <p className="gc-eyebrow">{t("guest.countdownTitle")}</p>
        <div className="gc-countdown">
          {parts.map((v, i) => (
            <div key={i} className="gc-count-box">
              <span className="gc-count-num" data-testid={`countdown-${["days", "hours", "minutes", "seconds"][i]}`}>{valid ? String(v).padStart(2, "0") : "--"}</span>
              <span className="gc-count-label">{labels[i]}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
};

export const VenueSection = ({ card, event, t, preview }) => {
  const [open, setOpen] = useState(false);
  const gcal = googleCalendarUrl(card, event);
  const over = eventStatus(event, card.timezone) === "over";
  return (
    <section className="gc-section" data-testid="card-venue-section">
      <Reveal>
        <div className="gc-panel gc-center">
          <MapPin className="gc-pin" size={30} />
          <p className="gc-eyebrow">{t("guest.venue")}</p>
          <h2 className="gc-heading" data-testid="card-venue-name">{event.venue_name || "—"}</h2>
          {event.venue_address && <p className="gc-muted" data-testid="card-venue-address">{event.venue_address}</p>}
          <div className="gc-actions">
            <a className="gc-btn" href={directionsUrl(event)} target="_blank" rel="noreferrer" data-testid="get-directions-button">
              <Navigation size={16} /> {t("guest.directions")}
            </a>
            {!over && (
              <button type="button" className="gc-btn gc-btn-ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid="add-calendar-button">
                <CalendarPlus size={16} /> {t("guest.addCalendar")}
              </button>
            )}
          </div>
          {open && !over && (
            <div className="gc-cal-options" data-testid="calendar-options">
              <a className="gc-link" href={preview || !card.slug ? undefined : icsUrl(card.slug, event.event_id)} aria-disabled={preview || !card.slug} data-testid="calendar-ics-link">{t("guest.downloadIcs")}</a>
              <a className="gc-link" href={gcal || undefined} target="_blank" rel="noreferrer" data-testid="calendar-google-link">{t("guest.googleCalendar")}</a>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
};

export const ClosingSection = ({ card, event }) => (
  <section className="gc-section gc-center" data-testid="card-closing-section">
    <Reveal>
      <EventDua card={card} ev={event} />
      <ClosingLine card={card} ev={event} />
    </Reveal>
  </section>
);

export const FooterSection = ({ card, t, tpl, onReplay }) => {
  const Divider = tpl.Divider;
  return (
    <footer className="gc-footer" data-testid="card-footer">
      <Divider />
      <p className="gc-eyebrow">{tCorp(t, card, "compliments")}</p>
      <FitText className="gc-host" data-testid="card-host-family">{card.host_family || namesLine(card)}</FitText>
      <button type="button" className="gc-btn gc-btn-ghost" onClick={onReplay} data-testid="card-replay-button">
        <RotateCcw size={16} /> {t("guest.replay")}
      </button>
      <a href="/" className="gc-madewith" data-testid="card-made-with-link">{t("guest.madeWith", { brand: BRAND.name })}</a>
    </footer>
  );
};
