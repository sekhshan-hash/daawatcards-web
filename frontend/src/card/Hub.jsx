import { ArrowLeft, ArrowRight, ChevronDown, Shirt, UtensilsCrossed } from "lucide-react";
import { displayTitle } from "@/lib/textSlots";
import { eventScheme, schemeDot } from "@/templates/eventColors";
import { eventStatus, formatLongDate, formatTime } from "@/lib/eventTime";
import { mealLine } from "@/lib/meals";
import { ClosingSection, CountdownSection, CoupleNames, FooterSection, MessageBlock, Reveal, Row, VenueSection } from "./CardSections";
import { PlacedPhoto, mainPhoto } from "./CardPhoto";
import { EventArt, secondScript } from "./EventArt";
import { ScratchDate } from "./ScratchDate";
import { EventOwnText, FamilyBlock, HeaderLine } from "./Wording";
import { WishesSection, wishesEnabled } from "./WishesSection";

export const hubHeading = (card, t) => card.hub_heading?.trim() || t(`guest.hub.${card.event_type}`);
const wishEvent = (card) => ({ ...card.events[0], name: displayTitle(card) });
const timeRange = (ev, lang) => [formatTime(ev.time, lang), formatTime(ev.end_time, lang)].filter(Boolean).join(" – ");
const Back = () => <ArrowLeft size={15} className="gc-dir-icon" aria-hidden="true" />;
const Fwd = () => <ArrowRight size={15} className="gc-dir-icon" aria-hidden="true" />;

const TimelineItem = ({ card, fullCard, tpl, ev, side, status, next, t, onOpen }) => {
  const second = secondScript(ev.name, card.language);
  const art = card.timeline_art !== false;
  const id = ev.event_id;
  return (
    <li className={`gc-tl-item is-${side} ${status === "over" ? "is-past" : ""} ${next ? "is-next" : ""} ${art ? "" : "no-art"}`}
      style={{ "--ev": schemeDot(tpl, eventScheme(fullCard, ev)) }} data-testid={`timeline-item-${id}`}>
      <Reveal className="gc-tl-reveal">
        <button type="button" className="gc-tl-btn" onClick={() => onOpen(id)} data-testid={`hub-event-${id}`}>
          <span className="gc-tl-marker" aria-hidden="true" />
          <span className="gc-tl-text">
            {status === "over" && <span className="gc-tl-tag" data-testid={`timeline-concluded-${id}`}>{t("guest.concluded")}</span>}
            {next && <span className="gc-tl-tag is-next" data-testid={`timeline-next-${id}`}>{t("guest.nextUp")}</span>}
            <span className="gc-tl-date" data-testid={`hub-event-${id}-when`}>{formatLongDate(ev.date, card.language)}</span>
            {ev.time && <span className="gc-tl-time">{timeRange(ev, card.language)}</span>}
            <span className="gc-tl-name">{ev.name}</span>
            {second && <span className="gc-tl-second" lang={card.language} data-testid={`timeline-second-${id}`}>{second}</span>}
            {ev.venue_name && <span className="gc-tl-venue">{ev.venue_name}</span>}
            <span className="gc-tl-more">{t("guest.viewDetails")} <Fwd /></span>
          </span>
          {art && <span className="gc-tl-art"><EventArt name={ev.name} testId={`timeline-art-${id}`} /></span>}
        </button>
      </Reveal>
    </li>
  );
};

const Timeline = ({ card, fullCard, tpl, events, t, onOpen }) => {
  const status = events.map((ev) => eventStatus(ev, card.timezone));
  const nextIdx = status.findIndex((s) => s === "upcoming" || s === "live");
  return (
    <ol className="gc-tl" data-testid="hub-timeline">
      {events.map((ev, i) => (
        <TimelineItem key={ev.event_id} card={card} fullCard={fullCard} tpl={tpl} ev={ev} side={i % 2 ? "right" : "left"} status={status[i]}
          next={i === nextIdx} t={t} onOpen={onOpen} />
      ))}
    </ol>
  );
};

export const CoverPage = ({ card, fullCard, events, t, tpl, guestName, guestId, preview, onReplay, onOpen }) => {
  const Frame = tpl.Frame;
  const Divider = tpl.Divider;
  return (
    <div className="gc-hub-page" data-testid="hub-cover">
      <section className={`gc-title-screen is-hub ${mainPhoto(card)?.place === "cover" ? "has-photo" : ""}`} data-testid="card-title-section">
        <Frame />
        <HeaderLine card={card} testId="card-cover-header-line" />
        <PlacedPhoto card={card} place="cover" variant="hero" testId="card-hero-photo" />
        <p className="gc-cover-title" dir="auto" data-testid="card-cover-invitation-title">{displayTitle(card)}</p>
        <CoupleNames card={card} tpl={tpl} />
        <Divider />
      </section>
      <section className="gc-section gc-center gc-hub-message">
        <Reveal><FamilyBlock card={card} /></Reveal>
        <MessageBlock card={card} t={t} />
      </section>
      <ScratchDate card={card} event={events[0]} t={t} />
      <section className="gc-section gc-hub" data-testid="hub-events">
        <h2 className="gc-hub-heading" dir="auto" data-testid="hub-heading">{hubHeading(card, t)}</h2>
        <Timeline card={card} fullCard={fullCard} tpl={tpl} events={events} t={t} onOpen={onOpen} />
      </section>
      <ClosingSection card={card} />
      {wishesEnabled(card) && <WishesSection card={card} event={wishEvent(card)} guestName={guestName} guestId={guestId} t={t} preview={preview} />}
      <FooterSection card={card} t={t} tpl={tpl} onReplay={onReplay} />
    </div>
  );
};

const EventNav = ({ card, events, index, t, onOpen, onWishes }) => {
  const prev = events[index - 1];
  const next = events[index + 1];
  return (
    <nav className="gc-section gc-event-nav" data-testid="event-nav">
      <div className="gc-event-nav-row">
        {prev ? <button type="button" className="gc-btn gc-btn-ghost" onClick={() => onOpen(prev.event_id)} data-testid="event-nav-prev"><Back /> {t("guest.previous")}</button> : <span />}
        {next && <button type="button" className="gc-btn" onClick={() => onOpen(next.event_id)} data-testid="event-nav-next">{t("guest.nextEvent", { event: next.name })} <Fwd /></button>}
      </div>
      <button type="button" className="gc-link gc-nav-all" onClick={() => onOpen(null)} data-testid="event-nav-all">{t("guest.backToAll")}</button>
      {wishesEnabled(card) && <button type="button" className="gc-link gc-nav-wishes" onClick={onWishes} data-testid="event-nav-wishes">{t("guest.sendWishesLink")} <ChevronDown size={14} /></button>}
    </nav>
  );
};

export const EventPage = ({ card, ev, events, t, preview, onOpen, onWishes }) => {
  const index = events.findIndex((e) => e.event_id === ev.event_id);
  const meal = mealLine(ev, t);
  return (
    <div className="gc-event-page" data-testid={`event-page-${ev.event_id}`}>
      <header className="gc-topbar" data-testid="event-topbar">
        <button type="button" onClick={() => onOpen(null)} className="gc-topbar-back" data-testid="event-back-all"><Back /> {t("guest.allEvents")}</button>
        <span className="gc-topbar-name" data-testid="event-topbar-name">{ev.name}</span>
      </header>
      <section className="gc-section gc-center">
        {card.timeline_art !== false && <EventArt name={ev.name} className="gc-art-hero" testId="event-page-art" />}
        <HeaderLine card={card} ev={ev} testId="card-event-header-line" />
        <Reveal><EventOwnText ev={ev} /></Reveal>
        <Reveal>
          <div className="gc-panel">
            <PlacedPhoto card={card} place={`event:${ev.event_id}`} variant="event" testId="card-event-photo" />
            <h2 className="gc-heading gc-event-title" data-testid="card-event-name">{ev.name}</h2>
            <p className="gc-event-when" data-testid="card-event-date">{formatLongDate(ev.date, card.language) || "—"}</p>
            <p className="gc-muted" data-testid="card-event-time">{timeRange(ev, card.language) || "—"}</p>
            {meal && <p className="gc-event-meal" data-testid="card-event-meal"><UtensilsCrossed size={15} /> {meal}</p>}
            {ev.dress_code && <div className="gc-rows gc-event-extra"><Row icon={Shirt} label={t("guest.dressCode")} value={ev.dress_code} testId="card-event-dress-code" /></div>}
            {ev.custom_text && <p className="gc-note" data-testid="card-event-custom-text">{ev.custom_text}</p>}
          </div>
        </Reveal>
      </section>
      <CountdownSection card={card} event={ev} t={t} />
      <VenueSection card={card} event={ev} t={t} preview={preview} />
      <EventNav card={card} events={events} index={index} t={t} onOpen={onOpen} onWishes={onWishes} />
    </div>
  );
};
