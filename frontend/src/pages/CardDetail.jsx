import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Copy, ExternalLink, MessageCircle, Pencil, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api, errMsg } from "@/lib/api";
import { copyText, guestPath, shareUrl, waLink } from "@/lib/links";
import { formatLongDate, formatTime, namesLine } from "@/lib/eventTime";
import { HostShell, FullLoader } from "@/components/host/HostShell";
import { t, makeT } from "@/i18n";

const LinkMaker = ({ card }) => {
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState(card.events[0].event_id);
  const ev = card.events.find((e) => e.event_id === eventId);
  const link = shareUrl(card.slug, eventId, name);
  const ct = makeT(card.language);
  const message = ct("whatsapp.invite", { guest: name.trim() || ct("guest.specialGuest"), event: ev.name, names: namesLine(card), date: formatLongDate(ev.date, card.language), link });
  const copy = async () => { await copyText(link); toast.success(t("common.copied")); };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8" data-testid="link-maker">
      <h2 className="font-display text-2xl text-foreground">{t("detail.quickLink")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("detail.linkMakerHint")}</p>
      {card.status !== "published" && <p className="mt-4 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose" data-testid="link-maker-draft-warning">{t("detail.draftWarning")}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <label className="field-label" htmlFor="lm-name">{t("detail.guestName")}</label>
          <Input id="lm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Khan" className="h-12 rounded-xl text-base" data-testid="link-maker-guest-name-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="lm-event">{t("detail.event")}</label>
          <select id="lm-event" value={eventId} onChange={(e) => setEventId(e.target.value)} className="field-select" data-testid="link-maker-event-select">
            {card.events.map((e) => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <p className="mt-5 break-all rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs text-muted-foreground" data-testid="link-maker-generated-link">{link}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="btn-outline" data-testid="link-maker-copy-button"><Copy size={16} /> {t("common.copy")}</button>
        <a href={waLink("", message)} target="_blank" rel="noreferrer" className="btn-gold" data-testid="link-maker-whatsapp-button"><MessageCircle size={16} /> {t("detail.sendWhatsapp")}</a>
      </div>
    </section>
  );
};

const RsvpList = ({ rsvps }) => {
  const yes = rsvps.filter((r) => r.attending);
  const heads = yes.reduce((n, r) => n + (r.count || 0), 0);
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8" data-testid="rsvp-list">
      <h2 className="font-display text-2xl text-foreground">{t("detail.rsvps")}</h2>
      <p className="mt-2 text-sm text-muted-foreground" data-testid="rsvp-summary">{t("detail.rsvpSummary", { yes: yes.length, no: rsvps.length - yes.length, heads })}</p>
      {rsvps.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">{t("detail.noRsvps")}</p> : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {rsvps.map((r) => (
            <li key={r.rsvp_id} className="rounded-2xl border border-border bg-background p-4" data-testid={`rsvp-item-${r.rsvp_id}`}>
              <p className="flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-foreground" dir="auto">{r.guest_name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${r.attending ? "bg-emerald-400/15 text-emerald-300" : "bg-rose/15 text-rose"}`}>
                  {r.attending ? t("detail.rsvpYes", { count: r.count }) : t("detail.rsvpNo")}
                </span>
              </p>
              {r.attending && <p className="mt-2 text-xs text-muted-foreground">{r.event_names.join(" · ")}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const WishesList = ({ wishes }) => (
  <section className="rounded-3xl border border-border bg-card p-6 sm:p-8" data-testid="wishes-list">
    <h2 className="font-display text-2xl text-foreground">{t("detail.wishes")}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{t("detail.wishesHint")}</p>
    {wishes.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">{t("detail.noWishes")}</p> : (
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {wishes.map((w) => (
          <li key={w.wish_id} className="rounded-2xl border border-border bg-background p-4" data-testid={`wish-item-${w.wish_id}`}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground" dir="auto">{w.message}</p>
            <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-gold">{w.guest_name}</span> · {w.event_name} · {new Date(w.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default function CardDetail() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [wishes, setWishes] = useState(null);
  const [rsvps, setRsvps] = useState(null);

  useEffect(() => {
    api.get(`/cards/${cardId}`).then((r) => setCard(r.data)).catch(() => navigate("/dashboard"));
    api.get(`/cards/${cardId}/wishes`).then((r) => setWishes(r.data)).catch(() => {});
    api.get(`/cards/${cardId}/rsvps`).then((r) => setRsvps(r.data)).catch(() => {});
  }, [cardId, navigate]);

  const publish = async () => {
    try {
      const { data } = await api.put(`/cards/${cardId}`, { ...card, status: "published" });
      setCard(data);
      toast.success(t("detail.published"));
    } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async () => {
    if (!window.confirm(t("detail.deleteConfirm"))) return;
    try {
      await api.delete(`/cards/${cardId}`);
      toast.success(t("detail.deleted"));
      navigate("/dashboard");
    } catch (e) { toast.error(errMsg(e)); }
  };

  if (!card) return <FullLoader />;
  return (
    <HostShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← {t("dashboard.title")}</Link>
          <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl" data-testid="card-detail-title">{namesLine(card)}</h1>
          <p className="mt-2 text-muted-foreground">{card.title} · /{card.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {card.status !== "published" && <button type="button" onClick={publish} className="btn-gold" data-testid="card-detail-publish-button">{t("detail.publish")}</button>}
          <Link to={`/cards/${cardId}/guests`} className="btn-gold" data-testid="card-detail-guests-button"><Users size={15} /> {t("detail.guestList")}</Link>
          <Link to={`/cards/${cardId}/edit`} className="btn-outline" data-testid="card-detail-edit-button"><Pencil size={15} /> {t("common.edit")}</Link>
          <button type="button" onClick={remove} className="btn-outline text-rose" data-testid="card-detail-delete-button"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <LinkMaker card={card} />
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8" data-testid="card-detail-events">
          <h2 className="font-display text-2xl text-foreground">{t("detail.events")}</h2>
          <ul className="mt-5 space-y-3">
            {card.events.map((e) => (
              <li key={e.event_id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{formatLongDate(e.date)} · {formatTime(e.time)}</p>
                </div>
                <a href={guestPath(card.slug, e.event_id)} target="_blank" rel="noreferrer" className="btn-chip shrink-0" data-testid={`card-detail-open-${e.event_id}`}><ExternalLink size={14} /> /{e.event_id}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-6">{rsvps && <RsvpList rsvps={rsvps} />}</div>
      <div className="mt-6">{wishes && <WishesList wishes={wishes} />}</div>
    </HostShell>
  );
}
