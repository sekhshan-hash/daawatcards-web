import { makeT, t } from "@/i18n";
import { formatLongDate, namesLine } from "@/lib/eventTime";
import { shareUrl, waLink } from "@/lib/links";

export const statusOf = (g) => (g.opened_at ? "opened" : g.sent_at ? "sent" : "pending");

const invitedEvents = (card, g) => {
  const evs = card.events.filter((e) => g.event_ids?.includes(e.event_id));
  return evs.length ? evs : card.events;
};

export const guestLink = (card, g) => shareUrl(card.slug, invitedEvents(card, g)[0].event_id, g.name, g.guest_id);

export const inviteMessage = (card, g) => {
  const ct = makeT(card.language);
  const evs = invitedEvents(card, g);
  return ct("whatsapp.invite", {
    guest: g.name, event: evs.map((e) => e.name).join(", "), names: namesLine(card),
    date: formatLongDate(evs[0].date, card.language), link: guestLink(card, g),
  });
};

export const guestWaLink = (card, g) => waLink(g.phone, inviteMessage(card, g));

export const EventChips = ({ card, value, onChange, testId }) => {
  if (card.events.length < 2) return null;
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    if (next.length) onChange(card.events.map((e) => e.event_id).filter((e) => next.includes(e)));
  };
  return (
    <div>
      <p className="field-label">{t("guests.invitedTo")}</p>
      <div className="flex flex-wrap gap-2" data-testid={testId}>
        {card.events.map((e) => (
          <button key={e.event_id} type="button" onClick={() => toggle(e.event_id)} data-testid={`${testId}-${e.event_id}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${value.includes(e.event_id) ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"}`}>
            {e.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const STATUS_STYLE = { pending: "bg-secondary text-muted-foreground", sent: "bg-sky-400/15 text-sky-300", opened: "bg-emerald-400/15 text-emerald-300" };

export const StatusPill = ({ status }) => (
  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${STATUS_STYLE[status]}`} data-testid="guest-status-pill">
    {t(`guests.status.${status}`)}
  </span>
);
