import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AgreeTerms } from "@/components/site/AgreeTerms";
import { Copy, ExternalLink, MessageCircle, Pencil, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api, errMsg } from "@/lib/api";
import { copyText, guestPath, shareUrl, waLink } from "@/lib/links";
import { formatLongDate, formatTime, namesLine } from "@/lib/eventTime";
import { HostShell, FullLoader } from "@/components/host/HostShell";
import { PlanBadge, UpgradeButton, isPaid } from "@/components/plans/Plans";
import { t, makeT } from "@/i18n";

const LinkMaker = ({ card }) => {
  const [name, setName] = useState("");
  const multi = card.events.length > 1;
  const [eventId, setEventId] = useState(multi ? "cover" : card.events[0].event_id);
  const ev = card.events.find((e) => e.event_id === eventId) || card.events[0];
  const link = shareUrl(card.slug, eventId, name);
  const ct = makeT(card.language);
  const message = ct("whatsapp.invite", { guest: name.trim() || ct("guest.specialGuest"), event: eventId === "cover" ? card.events.map((e) => e.name).join(", ") : ev.name, names: namesLine(card), date: formatLongDate(ev.date, card.language), link });
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
            {multi && <option value="cover">{t("detail.allEvents")}</option>}
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
  const [bill, setBill] = useState(null);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    api.get(`/cards/${cardId}`).then((r) => setCard(r.data)).catch(() => navigate("/dashboard"));
    api.get(`/cards/${cardId}/wishes`).then((r) => setWishes(r.data)).catch(() => {});
    api.get(`/billing/cards/${cardId}`).then((r) => setBill(r.data)).catch(() => {});
    api.get(`/cards/${cardId}/guests`).then((r) => setGuestCount(r.data.length)).catch(() => {});
  }, [cardId, navigate]);

  const [agreed, setAgreed] = useState(false);
  const publish = async () => {
    if (!agreed) return toast.error(t("site.agreeFirst"));
    try {
      const { data } = await api.put(`/cards/${cardId}`, { ...card, status: "published", agreed_terms: true });
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
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>{card.title} · /{card.slug}</span>
            <PlanBadge plan={card.plan} testId="card-detail-plan-badge" />
            {bill && !isPaid(bill.plan) && <span className="text-sm" data-testid="card-detail-guest-usage">{guestCount} / {bill.limit} guests used</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {card.status !== "published" && <button type="button" onClick={publish} className="btn-gold" data-testid="card-detail-publish-button">{t("detail.publish")}</button>}
          <Link to={`/cards/${cardId}/guests`} className="btn-gold" data-testid="card-detail-guests-button"><Users size={15} /> {t("detail.guestList")}</Link>
          <Link to={`/cards/${cardId}/edit`} className="btn-outline" data-testid="card-detail-edit-button"><Pencil size={15} /> {t("common.edit")}</Link>
          <UpgradeButton cardId={cardId} plan={card.plan} className="btn-outline" testId="card-detail-upgrade-button" />
          <button type="button" onClick={remove} className="btn-outline text-rose" data-testid="card-detail-delete-button"><Trash2 size={15} /></button>
        </div>
      </div>
      {!isPaid(card.plan) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3" data-testid="card-detail-plan-usage">
          <p className="text-sm text-foreground"><strong>{guestCount} / {bill?.limit ?? 2} guests used</strong> on the Free plan. Upgrade for unlimited guests, contacts import, CSV and no watermark.</p>
          <UpgradeButton cardId={cardId} plan={card.plan} testId="card-detail-usage-upgrade-button" />
        </div>
      )}
      {card.status !== "published" && <div className="max-w-xl"><AgreeTerms checked={agreed} onChange={setAgreed} testId="card-detail-agree-terms" /></div>}

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
      <div className="mt-6">{wishes && <WishesList wishes={wishes} />}</div>
    </HostShell>
  );
}
