import { useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api, errMsg } from "@/lib/api";
import { copyText } from "@/lib/links";
import { EventChips, StatusPill, guestLink, guestWaLink, statusOf } from "./shared";
import { t } from "@/i18n";

const GuestEditor = ({ card, guest, onSaved, onCancel }) => {
  const [draft, setDraft] = useState(guest);
  const save = async () => {
    try {
      const { data } = await api.put(`/cards/${card.card_id}/guests/${guest.guest_id}`, { name: draft.name, phone: draft.phone, event_ids: draft.event_ids });
      onSaved(data);
      toast.success(t("guests.updated"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <div className="space-y-3 rounded-2xl border border-gold/50 bg-card p-4" data-testid={`guest-editor-${guest.guest_id}`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-11 rounded-xl" maxLength={80} data-testid="guest-edit-name-input" />
        <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="h-11 rounded-xl" inputMode="tel" placeholder={t("guests.phone")} data-testid="guest-edit-phone-input" />
      </div>
      <EventChips card={card} value={draft.event_ids} onChange={(ids) => setDraft({ ...draft, event_ids: ids })} testId="guest-edit-events" />
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={!draft.name.trim()} className="btn-gold h-10 min-h-0" data-testid="guest-edit-save-button">{t("guests.save")}</button>
        <button type="button" onClick={onCancel} className="btn-outline h-10 min-h-0" data-testid="guest-edit-cancel-button">{t("common.cancel")}</button>
      </div>
    </div>
  );
};

export const GuestRow = ({ card, guest, onChange, onDelete }) => {
  const [editing, setEditing] = useState(false);
  if (editing) return <GuestEditor card={card} guest={guest} onCancel={() => setEditing(false)} onSaved={(g) => { onChange(g); setEditing(false); }} />;

  const markSent = () => api.post(`/cards/${card.card_id}/guests/${guest.guest_id}/sent`).then((r) => onChange(r.data)).catch(() => {});
  const copy = async () => {
    await copyText(guestLink(card, guest));
    toast.success(t("common.copied"));
  };
  const remove = async () => {
    if (!window.confirm(t("guests.deleteConfirm", { name: guest.name }))) return;
    try {
      await api.delete(`/cards/${card.card_id}/guests/${guest.guest_id}`);
      onDelete(guest.guest_id);
      toast.success(t("guests.deleted"));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const events = card.events.length > 1 ? card.events.filter((e) => guest.event_ids.includes(e.event_id)).map((e) => e.name).join(" · ") : "";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center" data-testid={`guest-row-${guest.guest_id}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-foreground" dir="auto" data-testid="guest-row-name">{guest.name}</p>
          <StatusPill status={statusOf(guest)} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{[guest.phone, events].filter(Boolean).join("  ·  ") || "—"}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <a href={guestWaLink(card, guest)} target="_blank" rel="noreferrer" onClick={markSent} className="btn-chip border-emerald-500/50 text-emerald-300" data-testid={`guest-whatsapp-${guest.guest_id}`}><MessageCircle size={14} /> WhatsApp</a>
        <button type="button" onClick={copy} className="btn-chip" aria-label={t("common.copy")} data-testid={`guest-copy-${guest.guest_id}`}><Copy size={14} /></button>
        <button type="button" onClick={() => setEditing(true)} className="btn-chip" aria-label={t("guests.edit")} data-testid={`guest-edit-${guest.guest_id}`}><Pencil size={14} /></button>
        <button type="button" onClick={remove} className="btn-chip text-rose" aria-label={t("common.delete")} data-testid={`guest-delete-${guest.guest_id}`}><Trash2 size={14} /></button>
      </div>
    </div>
  );
};
