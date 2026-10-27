import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg } from "@/lib/api";
import { dirFor, t } from "@/i18n";
import { PLACEHOLDERS, defaultTemplate, fillTemplate } from "./shared";

export const MessageDialog = ({ open, onOpenChange, card, sample, onSaved }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (open) setText(card.invite_template || defaultTemplate(card));
  }, [open, card]);

  const insert = (k) => {
    const el = ref.current;
    const at = el?.selectionStart ?? text.length;
    setText(`${text.slice(0, at)}{${k}}${text.slice(el?.selectionEnd ?? at)}`);
    requestAnimationFrame(() => el?.focus());
  };
  const save = async () => {
    setBusy(true);
    try {
      const value = text.trim() === defaultTemplate(card).trim() ? "" : text;
      const { data } = await api.put(`/cards/${card.card_id}/invite-template`, { template: value });
      onSaved(data);
      toast.success(t("guests.msgSaved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const preview = fillTemplate(card, sample || { name: t("guests.msgSampleName"), event_ids: [] }, text || " ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg" data-testid="message-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("guests.msgTitle")}</DialogTitle>
          <DialogDescription>{t("guests.msgHint")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2" data-testid="message-placeholders">
          {PLACEHOLDERS.map((k) => (
            <button key={k} type="button" onClick={() => insert(k)} className="rounded-full border border-gold/50 px-3 py-1 text-xs text-gold hover:bg-gold/10" data-testid={`message-insert-${k}`}>
              + {t(`guests.ph.${k}`)}
            </button>
          ))}
        </div>
        <Textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} dir={dirFor(card.language)} maxLength={2000} className="min-h-44 rounded-xl text-base" data-testid="message-textarea" />
        <div>
          <p className="field-label">{t("guests.msgPreview")}</p>
          <p className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-emerald-900/40 px-4 py-3 text-sm text-foreground" dir={dirFor(card.language)} data-testid="message-preview">{preview}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={busy || !text.trim()} className="btn-gold flex-1" data-testid="message-save-button">{t("guests.save")}</button>
          <button type="button" onClick={() => setText(defaultTemplate(card))} className="btn-outline" data-testid="message-reset-button"><RotateCcw size={15} /> {t("guests.msgReset")}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
