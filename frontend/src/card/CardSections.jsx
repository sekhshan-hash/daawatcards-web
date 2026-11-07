import { useEffect, useState } from "react";
import { CalendarPlus, ChevronDown, Clock, MapPin, Navigation, RotateCcw, Shirt, CalendarDays, UtensilsCrossed } from "lucide-react";
import { BRAND } from "@/config/brand";
import { COUPLE_TYPES, blessingText, tCorp } from "@/i18n";
import { useInView } from "@/hooks/useMedia";
import { directionsUrl, eventStartMs, eventStatus, formatLongDate, formatTime, googleCalendarUrl, namesLine } from "@/lib/eventTime";
import { icsUrl } from "@/lib/links";
import { cardHeader, eventConcluded, familyText } from "@/i18n/traditions";
import { PlacedPhoto, mainPhoto } from "./CardPhoto";
import { mealLine } from "@/lib/meals";
import { FitText } from "./FitText";
import { DuaBlock, FamilyBlock, HeaderLine } from "./Wording";
import { cardDua, closingText, displayTitle, invitationParagraph, mainEvent, occasionName } from "@/lib/textSlots";
import { ScriptText } from "./TokenText";
import { useScriptFont } from "@/lib/script";

export const Reveal = ({ children, className = "" }) => {
  const [ref, inView] = useInView();
  return <div ref={ref} className={`gc-reveal ${inView ? "is-in" : ""} ${className}`}>{children}</div>;
};



export const CoupleNames = ({ card, tpl }) => {
  const sf = useScriptFont(`${card.primary_name || ""} ${card.secondary_name || ""}`);
  const nameStyle = sf.fontFamily ? { fontFamily: `var(--font-display), ${sf.fontFamily}` } : undefined;
  return COUPLE_TYPES.includes(card.event_type) && card.secondary_name ? (
    <FitText as="h1" className="gc-names is-couple is-stacked" maxLines={5} data-testid="card-names" dir={sf.dir || undefined} style={nameStyle}>
      <span className="gc-name-line">{card.primary_name}</span>
      <span className="gc-amp">&amp;</span>
      <span className="gc-name-line">{card.secondary_name}</span>
    </FitText>
  ) : (
    <>
      <FitText as="h1" className="gc-names" data-testid="card-names" dir={sf.dir || undefined} style={nameStyle}>{tpl.renderName ? tpl.renderName(card.primary_name) : card.primary_name}</FitText>
      {card.secondary_name && <p className="gc-subname" dir={sf.dir || undefined} style={nameStyle}>{card.secondary_name}</p>}
    </>
  );
};

export const TitleSection = ({ card, event, t, tpl, single }) => {
  const couple = COUPLE_TYPES.includes(card.event_type) && card.secondary_name;
  const Frame = tpl.Frame;
  const Divider = tpl.Divider;
  return (
    <section className={`gc-title-screen ${single ? "is-single" : ""} ${mainPhoto(card)?.place === "cover" ? "has-photo" : ""}`} data-testid="card-title-section">
      <Frame />
      <PlacedPhoto card={card} place="cover" slot="top" variant="hero" testId="card-hero-photo-top" />
      <HeaderLine card={card} testId="card-cover-header-line" />
      <PlacedPhoto card={card} place="cover" slot="after-header" variant="hero" testId="card-hero-photo" />
      <FamilyBlock card={card} />
      {!familyText(card) && !(couple && cardHeader(card)?.id === "together") && <p className="gc-eyebrow">{t(`guest.eyebrow.${card.event_type}`)}</p>}
      <CoupleNames card={card} tpl={tpl} />
      <PlacedPhoto card={card} place="cover" slot="after-names" variant="event" testId="card-hero-photo-names" />
      <Divider />
      <p className="gc-title" data-testid="card-event-title">{displayTitle(card)}</p>
      <div className="gc-scroll-cue"><span>{t("guest.scroll")}</span><ChevronDown size={18} /></div>
    </section>
  );
};

// One invitation paragraph, then the blessing and dua: each shown once per card.
export const MessageBlock = ({ card, t }) => {
  const text = invitationParagraph(card);
  const blessing = blessingText(t, card);
  return (
    <>
      {text && <Reveal><ScriptText as="p" className="gc-invite" text={text} testId="card-invitation-text" /></Reveal>}
      <PlacedPhoto card={card} place="cover" slot="after-invitation" variant="event" testId="card-photo-after-invitation" />
      {blessing && <Reveal><ScriptText as="blockquote" className="gc-blessing" text={blessing} testId="card-blessing" /></Reveal>}
      <PlacedPhoto card={card} place="cover" slot="after-blessing" variant="event" testId="card-photo-after-blessing" />
      <Reveal><DuaBlock dua={cardDua(card)} /></Reveal>
    </>
  );
};


export const Row = ({ icon: Icon, label, value, testId }) => (
  <div className="gc-row">
    <Icon size={18} className="gc-row-icon" />
    <div><p className="gc-row-label">{label}</p><p className="gc-row-value" data-testid={testId}>{value}</p></div>
  </div>
);

export const DetailsSection = ({ card, event, t }) => {
  const time = [formatTime(event.time, card.language), formatTime(event.end_time, card.language)].filter(Boolean).join(" – ");
  return (
    <section className="gc-section" data-testid="card-details-section">
      <MessageBlock card={card} t={t} />
      <Reveal>
        <div className="gc-panel">
          <PlacedPhoto card={card} place={`event:${event.event_id}`} slot="top" variant="event" testId="card-event-photo" />
          <p className="gc-eyebrow">{t("guest.eventLabel")}</p>
          <h2 className="gc-heading" data-testid="card-event-name"><ScriptText as="span" preserveLines={false} text={occasionName(card)} /></h2>
          <PlacedPhoto card={card} place={`event:${event.event_id}`} slot="after-name" variant="event" testId="card-event-photo-after-name" />
          <div className="gc-rows">
            <Row icon={CalendarDays} label={t("guest.date")} value={formatLongDate(event.date, card.language) || "—"} testId="card-event-date" />
            <Row icon={Clock} label={t("guest.time")} value={time || "—"} testId="card-event-time" />
            {mealLine(event, t) && <Row icon={UtensilsCrossed} label={t("guest.meal")} value={mealLine(event, t)} testId="card-event-meal" />}
            {event.dress_code && <Row icon={Shirt} label={t("guest.dressCode")} value={event.dress_code} testId="card-event-dress-code" />}
          </div>
          <PlacedPhoto card={card} place={`event:${event.event_id}`} slot="after-datetime" variant="event" testId="card-event-photo-after-datetime" />
          {event.custom_text && <ScriptText as="p" className="gc-note" text={event.custom_text} testId="card-event-custom-text" />}
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
  const gcal = googleCalendarUrl(card, event, mealLine(event, t));
  const over = eventStatus(event, card.timezone) === "over";
  return (
    <section className="gc-section" data-testid="card-venue-section">
      <Reveal>
        <div className="gc-panel gc-center">
          <MapPin className="gc-pin" size={30} />
          <p className="gc-eyebrow">{t("guest.venue")}</p>
          <h2 className="gc-heading" data-testid="card-venue-name"><ScriptText as="span" preserveLines={false} text={event.venue_name || "—"} /></h2>
          {event.venue_address && <ScriptText as="p" className="gc-muted" text={event.venue_address} testId="card-venue-address" />}
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
          <PlacedPhoto card={card} place={`event:${event.event_id}`} slot="after-venue" variant="event" testId="card-event-photo-after-venue" />
        </div>
      </Reveal>
    </section>
  );
};

// Closing line once, at the end of the card.
export const ClosingSection = ({ card }) => {
  const text = closingText(card);
  const rsvp = mainEvent(card)?.rsvp_line;
  if (!text && !rsvp) return null;
  return (
    <section className="gc-section gc-center" data-testid="card-closing-section">
      <Reveal>
        {rsvp && <ScriptText as="p" className="gc-muted gc-center" text={rsvp} testId="card-event-rsvp-line" />}
        {text && <ScriptText as="p" className="gc-closing" text={text} testId="card-event-closing" />}
      </Reveal>
    </section>
  );
};

export const FooterSection = ({ card, t, tpl, onReplay }) => {
  const Divider = tpl.Divider;
  const host = card.host_family || namesLine(card);
  const sf = useScriptFont(host);
  return (
    <footer className="gc-footer" data-testid="card-footer">
      <Divider />
      <p className="gc-eyebrow">{tCorp(t, card, "compliments")}</p>
      <FitText className="gc-host" data-testid="card-host-family" dir={sf.dir || undefined} style={sf.fontFamily ? { fontFamily: `var(--font-display), ${sf.fontFamily}` } : undefined}>{host}</FitText>
      <button type="button" className="gc-btn gc-btn-ghost" onClick={onReplay} data-testid="card-replay-button">
        <RotateCcw size={16} /> {t("guest.replay")}
      </button>
      <a href="/" className="gc-madewith" data-testid="card-made-with-link">{t("guest.madeWith", { brand: BRAND.name })}</a>
    </footer>
  );
};
