import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";
import { Download, MessageCircle, PenLine, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { namesLine } from "@/lib/eventTime";
import { HostShell, FullLoader } from "@/components/host/HostShell";
import { AddGuestsDialog } from "./guests/AddGuestsDialog";
import { BulkBar } from "./guests/BulkBar";
import { GuestRow } from "./guests/GuestRow";
import { MessageDialog } from "./guests/MessageDialog";
import { SendQueueDialog } from "./guests/SendQueueDialog";
import { guestLink, statusOf } from "./guests/shared";
import { t } from "@/i18n";

const exportCsv = (card, guests) => {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const names = (g) => card.events.filter((e) => g.event_ids.includes(e.event_id)).map((e) => e.name).join(" | ");
  const lines = [["Name", "Phone", "Events", "Status", "Opened at", "Link"],
    ...guests.map((g) => [g.name, g.phone, names(g), statusOf(g), g.opened_at || "", guestLink(card, g)])];
  const blob = new Blob(["\uFEFF" + lines.map((l) => l.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${card.slug}-guests.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const Stat = ({ label, testId }) => <span className="rounded-full border border-border px-4 py-2 text-sm text-foreground" data-testid={testId}>{label}</span>;
const FILTERS = ["all", "pending", "sent", "opened"];

export default function GuestsPage() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [guests, setGuests] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [queue, setQueue] = useState(null);

  const loadGuests = useCallback(() => api.get(`/cards/${cardId}/guests`).then((r) => setGuests(r.data)).catch(() => {}), [cardId]);
  useEffect(() => {
    api.get(`/cards/${cardId}`).then((r) => setCard(r.data)).catch(() => navigate("/dashboard"));
    loadGuests();
  }, [cardId, navigate, loadGuests]);

  const upsert = (g) => setGuests((list) => list.map((x) => (x.guest_id === g.guest_id ? g : x)));
  const removeIds = (ids) => {
    setGuests((l) => l.filter((x) => !ids.includes(x.guest_id)));
    setSelected((s) => new Set([...s].filter((id) => !ids.includes(id))));
  };
  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    if (!n.delete(id)) n.add(id);
    return n;
  });
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    return guests.filter((g) => (filter === "all" || statusOf(g) === filter)
      && (!s || g.name.toLowerCase().includes(s) || (digits && g.phone.includes(digits))));
  }, [guests, q, filter]);

  if (!card) return <FullLoader />;
  const sent = guests.filter((g) => statusOf(g) !== "pending").length;
  const opened = guests.filter((g) => g.opened_at).length;
  const allSel = filtered.length > 0 && filtered.every((g) => selected.has(g.guest_id));
  const selectAll = () => setSelected(allSel ? new Set() : new Set(filtered.map((g) => g.guest_id)));

  return (
    <HostShell>
      <Link to={`/cards/${cardId}`} className="text-sm text-muted-foreground hover:text-foreground">← {namesLine(card)}</Link>
      <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl" data-testid="guests-page-title">{t("guests.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("guests.subtitle")}</p>
      {card.status !== "published" && <p className="mt-4 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose" data-testid="guests-draft-warning">{t("detail.draftWarning")}</p>}

      <div className="mt-8 flex flex-wrap gap-2">
        <Stat label={t("guests.total", { count: guests.length })} testId="guests-stat-total" />
        <Stat label={t("guests.sent", { count: sent })} testId="guests-stat-sent" />
        <Stat label={t("guests.opened", { count: opened })} testId="guests-stat-opened" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={() => setAddOpen(true)} className="btn-gold" data-testid="guests-add-button"><UserPlus size={16} /> {t("guests.add")}</button>
        <button type="button" onClick={() => setQueue(guests)} disabled={!guests.length} className="btn-outline" data-testid="guests-send-all-button"><MessageCircle size={16} /> {t("guests.sendAll")}</button>
        <button type="button" onClick={() => setMsgOpen(true)} className="btn-outline" data-testid="guests-message-button"><PenLine size={16} /> {t("guests.message")}</button>
        <button type="button" onClick={() => exportCsv(card, guests)} disabled={!guests.length} className="btn-outline" data-testid="guests-export-button"><Download size={16} /> {t("guests.exportCsv")}</button>
        <div className="relative sm:ml-auto sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("guests.search")} className="h-12 rounded-full pl-10" data-testid="guests-search-input" />
        </div>
      </div>

      {guests.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <label className="mr-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={allSel} onCheckedChange={selectAll} data-testid="guests-select-all" /> {t("guests.selectAll", { count: filtered.length })}
          </label>
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} data-testid={`guests-filter-${f}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${filter === f ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t(`guests.filters.${f}`)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 pb-10" data-testid="guests-list">
        {guests.length === 0 && <p className="rounded-3xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground" data-testid="guests-empty-state">{t("guests.empty")}</p>}
        {guests.length > 0 && filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground" data-testid="guests-no-match">{t("guests.noMatch")}</p>}
        <Virtuoso useWindowScroll data={filtered} computeItemKey={(_, g) => g.guest_id} increaseViewportBy={400}
          itemContent={(_, g) => (
            <div className="pb-2.5">
              <GuestRow card={card} guest={g} onChange={upsert} onDelete={(id) => removeIds([id])} selected={selected.has(g.guest_id)} onSelect={toggle} />
            </div>
          )} />
      </div>

      {selected.size > 0 && (
        <BulkBar card={card} selected={selected} guests={guests} onClear={() => setSelected(new Set())} onDeleted={removeIds}
          onReplace={setGuests} onSend={() => setQueue(guests.filter((g) => selected.has(g.guest_id)))} />
      )}

      <AddGuestsDialog open={addOpen} onOpenChange={setAddOpen} card={card} existing={guests} onAdded={(added) => setGuests((l) => [...l, ...added])} onMerged={loadGuests} />
      <MessageDialog open={msgOpen} onOpenChange={setMsgOpen} card={card} sample={guests[0]} onSaved={setCard} />
      <SendQueueDialog open={!!queue} onOpenChange={(o) => !o && setQueue(null)} card={card} guests={queue || []} onSent={upsert} />
    </HostShell>
  );
}
