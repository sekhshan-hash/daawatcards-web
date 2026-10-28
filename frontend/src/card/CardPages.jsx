import { ClosingSection, CountdownSection, DetailsSection, FooterSection, TitleSection, VenueSection } from "./CardSections";
import { ScratchDate } from "./ScratchDate";
import { WishesSection, wishesEnabled } from "./WishesSection";

const wishEvent = (card) => ({ ...card.events[0], name: card.title || card.events[0].name });

export const SinglePage = ({ card, event, t, tpl, preview, guestName, guestId, onReplay }) => (
  <>
    <TitleSection card={card} event={event} t={t} tpl={tpl} single />
    <ScratchDate card={card} event={event} t={t} />
    <DetailsSection card={card} event={event} t={t} />
    <CountdownSection card={card} event={event} t={t} />
    <VenueSection card={card} event={event} t={t} preview={preview} />
    <ClosingSection card={card} event={event} />
    {wishesEnabled(card) && <WishesSection card={card} event={wishEvent(card)} guestName={guestName} guestId={guestId} t={t} preview={preview} />}
    <FooterSection card={card} t={t} tpl={tpl} onReplay={onReplay} />
  </>
);
