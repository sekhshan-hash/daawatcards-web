import { useCallback, useMemo } from "react";
import { colorVars, eventScheme, schemeDot, schemeVars } from "@/templates/eventColors";
import { blessingText } from "@/i18n";
import { ClosingSection, CountdownSection, DetailsSection, FooterSection, Reveal, TitleSection, VenueSection } from "./CardSections";
import { CardPhoto } from "./CardPhoto";
import { SwipePages } from "./SwipePages";
import { WishesSection } from "./WishesSection";

const wishEvent = (card) => ({ ...card.events[0], name: card.title || card.events[0].name });

const FinalSections = ({ card, t, tpl, guestName, guestId, preview, onReplay, withIntro }) => {
  const blessing = blessingText(t, card);
  return (
    <>
      {withIntro && card.photos?.[1] && <section className="gc-section"><Reveal><CardPhoto path={card.photos[1]} fit={card.photo_fit?.feature} variant="feature" testId="card-feature-photo" /></Reveal></section>}
      {withIntro && blessing && <section className="gc-section"><Reveal><blockquote className="gc-blessing" data-testid="card-blessing">{blessing}</blockquote></Reveal></section>}
      <WishesSection card={card} event={wishEvent(card)} guestName={guestName} guestId={guestId} t={t} preview={preview} />
      <FooterSection card={card} t={t} tpl={tpl} onReplay={onReplay} />
    </>
  );
};

export const SinglePage = ({ card, event, t, tpl, preview, ...rest }) => (
  <>
    <TitleSection card={card} event={event} t={t} tpl={tpl} single />
    <DetailsSection card={card} event={event} t={t} />
    <CountdownSection card={card} event={event} t={t} />
    <VenueSection card={card} event={event} t={t} preview={preview} />
    <ClosingSection card={card} event={event} />
    <FinalSections card={card} t={t} tpl={tpl} preview={preview} {...rest} />
  </>
);

export const MultiPages = ({ card, fullCard, events, start, target, locked, reduced, dir, t, tpl, preview, onScheme, ...rest }) => {
  const schemes = useMemo(() => ["template", ...events.map((e) => eventScheme(fullCard, e)), "template"], [events, fullCard]);
  const onIndex = useCallback((i) => onScheme(schemes[i]), [schemes, onScheme]);
  const count = events.length + 2;
  const pageStyle = (i) => (schemes[i] === "template" ? undefined : colorVars(schemeVars(tpl, schemes[i])));

  const renderPage = (i, goTo) => {
    if (i === 0) {
      return (
        <>
          <TitleSection card={card} event={events[0]} t={t} tpl={tpl} cover events={events} onJump={goTo} />
          {card.invitation_text && <section className="gc-section"><Reveal><p className="gc-invite" data-testid="card-invitation-text">{card.invitation_text}</p></Reveal></section>}
        </>
      );
    }
    if (i === count - 1) return <FinalSections card={card} t={t} tpl={tpl} preview={preview} withIntro {...rest} />;
    const ev = events[i - 1];
    return (
      <div className="gc-event-page" data-testid={`event-page-${ev.event_id}`}>
        <DetailsSection card={card} event={ev} t={t} page />
        <CountdownSection card={card} event={ev} t={t} />
        <VenueSection card={card} event={ev} t={t} preview={preview} />
        <ClosingSection card={card} event={ev} />
      </div>
    );
  };

  return (
    <SwipePages count={count} start={start} target={target} locked={locked} reduced={reduced} dir={dir} t={t} onIndex={onIndex}
      renderPage={renderPage} pageStyle={pageStyle} dotColors={schemes.map((s) => schemeDot(tpl, s))} />
  );
};
