import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { guestPath } from "@/lib/links";
import { namesLine } from "@/lib/eventTime";
import { introTitle } from "@/i18n/traditions";
import { t } from "@/i18n";
import { BRAND } from "@/config/brand";
import { GuestCard } from "@/card/GuestCard";

export default function GuestCardPage() {
  const { slug, eventId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const guestName = params.get("to") || "";
  const guestId = params.get("g") || "";
  const [guest, setGuest] = useState(null);
  const [card, setCard] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/public/cards/${slug}`).then((r) => setCard(r.data)).catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!guestId) return;
    api.post(`/public/cards/${slug}/opened`, { guest_id: guestId }).then((r) => setGuest(r.data)).catch(() => {});
  }, [slug, guestId]);

  useEffect(() => {
    if (card) document.title = `${introTitle(card)} · ${namesLine(card)}`;
  }, [card]);

  if (error) {
    return (
      <div className="guest-page grid place-items-center px-6 text-center" data-testid="guest-card-not-found">
        <div>
          <p className="font-display text-2xl text-gold">{t("guest.notFound")}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t("guest.notFoundHint")}</p>
          <a href="/" className="mt-6 inline-block text-gold underline">{BRAND.name}</a>
        </div>
      </div>
    );
  }
  if (!card) return <div className="guest-page grid place-items-center" data-testid="guest-card-loading"><div className="loader-ring" /></div>;

  const event = card.events.find((e) => e.event_id === eventId) || card.events[0];
  const select = (id) => navigate(guestPath(slug, id, guestName, guestId), { replace: true });
  // Event links open on that event's page; guest links open on the cover unless the guest has a single event.
  const invited = guest?.event_ids || [];
  const openOn = guestId ? (invited.length === 1 ? invited[0] : null) : eventId ? event.event_id : null;

  return (
    <div className="guest-page">
      <GuestCard card={card} eventId={openOn} guestName={guest?.name || guestName} guestId={guestId} eventIds={guest?.event_ids} onSelectEvent={select} />
    </div>
  );
}
