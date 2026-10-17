import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { guestWaLink, statusOf } from "./shared";
import { t } from "@/i18n";

export const SendQueueDialog = ({ open, onOpenChange, card, guests, onSent }) => {
  const [onlyUnsent, setOnlyUnsent] = useState(true);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQueue(guests.filter((g) => !onlyUnsent || statusOf(g) === "pending"));
    setIdx(0);
    // Queue is frozen when opened so marking guests as sent doesn't reshuffle it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onlyUnsent]);

  const current = queue[idx];
  const sent = () => {
    api.post(`/cards/${card.card_id}/guests/${current.guest_id}/sent`).then((r) => onSent(r.data)).catch(() => {});
    setIdx((i) => i + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="send-queue-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("guests.queueTitle")}</DialogTitle>
          <DialogDescription>{t("guests.queueHint")}</DialogDescription>
        </DialogHeader>
        {idx === 0 && (
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
            {t("guests.onlyUnsent")}
            <Switch checked={onlyUnsent} onCheckedChange={setOnlyUnsent} data-testid="send-queue-only-unsent-switch" />
          </label>
        )}
        {queue.length > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${(Math.min(idx, queue.length) / queue.length) * 100}%` }} />
          </div>
        )}
        {current ? (
          <div className="space-y-4 text-center" data-testid="send-queue-current">
            <p className="text-xs uppercase tracking-widest text-muted-foreground" data-testid="send-queue-progress">{t("guests.queueProgress", { current: idx + 1, total: queue.length })}</p>
            <p className="font-display text-2xl text-foreground" dir="auto" data-testid="send-queue-guest-name">{current.name}</p>
            <p className="text-sm text-muted-foreground">{current.phone || t("guests.noPhone")}</p>
            <a href={guestWaLink(card, current)} target="_blank" rel="noreferrer" onClick={sent} className="btn-gold w-full" data-testid="send-queue-open-button">
              <MessageCircle size={17} /> {t("guests.queueOpen", { name: current.name })}
            </a>
            <button type="button" onClick={() => setIdx((i) => i + 1)} className="text-sm text-muted-foreground hover:text-foreground" data-testid="send-queue-skip-button">{t("guests.queueSkip")}</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center" data-testid="send-queue-done">
            <CheckCircle2 size={36} className="text-emerald-400" />
            <p className="text-sm text-muted-foreground">{t("guests.queueDone")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
