import { ClosingSection, CountdownSection, DetailsSection, FooterSection, TitleSection, VenueSection } from "./CardSections";
import { PlacedPhoto } from "./CardPhoto";
import { displayTitle } from "@/lib/textSlots";
import { WishesSection, wishesEnabled } from "./WishesSection";

const wishEvent = (card) => ({ ...card.events[0], name: displayTitle(card) });

export const SinglePage = ({ card, event, t, tpl, preview, guestName, guestId, onReplay }) => (
  <>
    <TitleSection card={card} event={event} t={t} tpl={tpl} single />
    <DetailsSection card={card} event={event} t={t} />
    <CountdownSection card={card} event={event} t={t} />
    <VenueSection card={card} event={event} t={t} preview={preview} />
    <PlacedPhoto card={card} place={`event:${event.event_id}`} slot="end" variant="event" testId="card-event-photo-end" />
    <PlacedPhoto card={card} place="cover" slot="end" variant="event" testId="card-photo-cover-end" />
    <ClosingSection card={card} />
    {wishesEnabled(card) && <WishesSection card={card} event={wishEvent(card)} guestName={guestName} guestId={guestId} t={t} preview={preview} />}
    <FooterSection card={card} t={t} tpl={tpl} onReplay={onReplay} />
  </>
);
