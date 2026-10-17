import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Plus, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { guestPath } from "@/lib/links";
import { namesLine } from "@/lib/eventTime";
import { useAuth } from "@/context/AuthContext";
import { HostShell } from "@/components/host/HostShell";
import { getTemplate } from "@/templates/registry";
import { t } from "@/i18n";

const StatusPill = ({ status }) => (
  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${status === "published" ? "bg-emerald-400/15 text-emerald-300" : "bg-secondary text-muted-foreground"}`} data-testid="card-status-pill">
    {status === "published" ? t("common.live") : t("common.draft")}
  </span>
);

const CardRow = ({ card }) => {
  const tpl = getTemplate(card.template);
  return (
    <div className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-gold/40 sm:flex-row sm:items-center" data-testid={`dashboard-card-${card.card_id}`}>
      <div className="h-16 w-16 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${tpl.swatch[0]}, ${tpl.swatch[1]} 60%, ${tpl.swatch[2]})` }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg font-semibold text-foreground">{namesLine(card)}</h3>
          <StatusPill status={card.status} />
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">{t(`eventTypes.${card.event_type}`)} · {t(`templates.${card.template}.name`)} · {card.events.length === 1 ? t("dashboard.event") : t("dashboard.events", { count: card.events.length })}</p>
        <p className="mt-1 text-xs text-muted-foreground">{card.rsvp.responses === 1 ? t("dashboard.response") : t("dashboard.responses", { count: card.rsvp.responses })} · {t("dashboard.attending", { count: card.rsvp.attending })}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/cards/${card.card_id}`} className="btn-chip" data-testid={`dashboard-manage-${card.card_id}`}><Share2 size={14} /> {t("common.manage")}</Link>
        <Link to={`/cards/${card.card_id}/edit`} className="btn-chip" data-testid={`dashboard-edit-${card.card_id}`}><Pencil size={14} /> {t("common.edit")}</Link>
        {card.status === "published" && (
          <a href={guestPath(card.slug, card.events[0].event_id)} target="_blank" rel="noreferrer" className="btn-chip" data-testid={`dashboard-view-${card.card_id}`}><ExternalLink size={14} /> {t("common.view")}</a>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [cards, setCards] = useState(null);
  useEffect(() => { api.get("/cards").then((r) => setCards(r.data)).catch(() => setCards([])); }, []);

  return (
    <HostShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gold" data-testid="dashboard-greeting">{t("dashboard.hello", { name: user?.name || "" })}</p>
          <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">{t("dashboard.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Link to="/create" className="btn-gold self-start" data-testid="dashboard-create-card-button"><Plus size={17} /> {t("dashboard.create")}</Link>
      </div>

      <div className="mt-12 space-y-4" data-testid="dashboard-card-list">
        {cards === null && <div className="h-24 animate-pulse rounded-2xl bg-card" />}
        {cards?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center" data-testid="dashboard-empty-state">
            <h2 className="font-display text-2xl text-foreground">{t("dashboard.empty")}</h2>
            <p className="mt-2 text-muted-foreground">{t("dashboard.emptyHint")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/create" className="btn-gold">{t("dashboard.create")}</Link>
              <Link to={guestPath("aftab-hifza", "e1", user?.name)} className="btn-outline" data-testid="dashboard-demo-link">{t("landing.ctaDemo")}</Link>
            </div>
          </div>
        )}
        {cards?.map((c) => <CardRow key={c.card_id} card={c} />)}
      </div>
    </HostShell>
  );
}
