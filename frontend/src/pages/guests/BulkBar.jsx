import { toast } from "sonner";
import { MessageCircle, Sparkles, Trash2, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api, errMsg } from "@/lib/api";
import { t } from "@/i18n";

const tidyName = (n) => {
  const s = n.replace(/[^\p{L}\p{M}\p{N}\s.'-]/gu, " ").replace(/\s+/g, " ").trim();
  if (!s) return n;
  const latin = /^[\p{Script=Latin}\s.'\d-]+$/u.test(s);
  return latin && (s === s.toLowerCase() || s === s.toUpperCase())
    ? s.toLowerCase().replace(/(^|[\s.'-])\p{L}/gu, (m) => m.toUpperCase()) : s;
};

export const BulkBar = ({ card, selected, guests, onClear, onDeleted, onReplace, onSend }) => {
  const ids = [...selected];
  const remove = async () => {
    try {
      const { data } = await api.post(`/cards/${card.card_id}/guests/bulk-delete`, { guest_ids: ids });
      toast.success(t("guests.deletedMany", { count: data.deleted }));
      onDeleted(ids);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const tidy = async () => {
    const changes = guests.filter((g) => selected.has(g.guest_id) && tidyName(g.name) !== g.name)
      .map((g) => ({ guest_id: g.guest_id, name: tidyName(g.name) }));
    if (!changes.length) return toast(t("guests.tidyNone"));
    try {
      const { data } = await api.post(`/cards/${card.card_id}/guests/bulk-rename`, { guests: changes });
      onReplace(data);
      toast.success(t("guests.tidied", { count: changes.length }));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex w-full max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-gold/50 bg-card/90 p-3 shadow-2xl backdrop-blur-xl" data-testid="guests-bulk-bar">
      <span className="px-2 text-sm font-semibold text-foreground" data-testid="guests-selected-count">{t("guests.selected", { count: ids.length })}</span>
      <button type="button" onClick={onSend} className="btn-chip border-emerald-500/50 text-emerald-300" data-testid="guests-bulk-send-button"><MessageCircle size={14} /> {t("guests.sendSel")}</button>
      <button type="button" onClick={tidy} className="btn-chip" data-testid="guests-bulk-tidy-button"><Sparkles size={14} /> {t("guests.tidy")}</button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className="btn-chip text-rose" data-testid="guests-bulk-delete-button"><Trash2 size={14} /> {t("guests.deleteSel")}</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("guests.deleteSelConfirm", { count: ids.length })}</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="guests-bulk-delete-cancel">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-rose text-white hover:bg-rose/90" data-testid="guests-bulk-delete-confirm">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <button type="button" onClick={onClear} className="ml-auto grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground" aria-label={t("guests.clearSel")} data-testid="guests-bulk-clear-button"><X size={16} /></button>
    </div>
  );
};
