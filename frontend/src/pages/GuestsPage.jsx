import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, MessageCircle, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { namesLine } from "@/lib/eventTime";
import { HostShell, FullLoader } from "@/components/host/HostShell";
import { AddGuestsDialog } from "./guests/AddGuestsDialog";
import { GuestRow } from "./guests/GuestRow";
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

export default function GuestsPage() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [guests, setGuests] = useState([]);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  useEffect(() => {
    api.get(`/cards/${cardId}`).then((r) => setCard(r.data)).catch(() => navigate("/dashboard"));
    api.get(`/cards/${cardId}/guests`).then((r) => setGuests(r.data)).catch(() => {});
  }, [cardId, navigate]);

  const upsert = (g) => setGuests((list) => list.map((x) => (x.guest_id === g.guest_id ? g : x)));
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? guests.filter((g) => g.name.toLowerCase().includes(s) || g.phone.includes(s)) : guests;
  }, [guests, q]);

  if (!card) return <FullLoader />;
  const sent = guests.filter((g) => statusOf(g) !== "pending").length;
  const opened = guests.filter((g) => g.opened_at).length;

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
        <button type="button" onClick={() => setQueueOpen(true)} disabled={!guests.length} className="btn-outline" data-testid="guests-send-all-button"><MessageCircle size={16} /> {t("guests.sendAll")}</button>
        <button type="button" onClick={() => exportCsv(card, guests)} disabled={!guests.length} className="btn-outline" data-testid="guests-export-button"><Download size={16} /> {t("guests.exportCsv")}</button>
        <div className="relative sm:ml-auto sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("guests.search")} className="h-12 rounded-full pl-10" data-testid="guests-search-input" />
        </div>
      </div>

      <div className="mt-6 space-y-2.5 pb-10" data-testid="guests-list">
        {guests.length === 0 && <p className="rounded-3xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground" data-testid="guests-empty-state">{t("guests.empty")}</p>}
        {filtered.map((g) => (
          <GuestRow key={g.guest_id} card={card} guest={g} onChange={upsert} onDelete={(id) => setGuests((l) => l.filter((x) => x.guest_id !== id))} />
        ))}
      </div>

      <AddGuestsDialog open={addOpen} onOpenChange={setAddOpen} card={card} onAdded={(added) => setGuests((l) => [...l, ...added])} />
      <SendQueueDialog open={queueOpen} onOpenChange={setQueueOpen} card={card} guests={guests} onSent={upsert} />
    </HostShell>
  );
}
