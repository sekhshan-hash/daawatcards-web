import { ChevronDown, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CLOSINGS, cardHeader, defaultClosing, defaultConcluded, defaultDua, defaultWording } from "@/i18n/traditions";
import { t } from "@/i18n";

// value: null/undefined = tradition default, "" = hidden, string = custom.
const Line = ({ label, value, def, onChange, multiline, testId, dir, children }) => {
  const hidden = value === "";
  const shown = value ?? def;
  const Box = multiline ? Textarea : Input;
  return (
    <div data-testid={testId}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="flex gap-1">
          <button type="button" onClick={() => onChange(hidden ? null : "")} className="btn-chip h-8 min-h-0 px-2.5 text-[11px]" data-testid={`${testId}-toggle`}>
            {hidden ? <><Eye size={12} /> {t("wizard.wfShow")}</> : <><EyeOff size={12} /> {t("wizard.wfHide")}</>}
          </button>
          {value !== null && value !== undefined && !hidden && (
            <button type="button" onClick={() => onChange(null)} className="btn-chip h-8 min-h-0 px-2.5 text-[11px]" data-testid={`${testId}-reset`}><RotateCcw size={12} /> {t("wizard.wfReset")}</button>
          )}
        </span>
      </div>
      {hidden ? <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">{t("wizard.wfHidden")}</p> : (
        <>
          {children}
          <Box value={shown} onChange={(e) => onChange(e.target.value)} dir={dir || "auto"} className={`rounded-xl text-base ${multiline ? "min-h-20" : "h-11"}`} maxLength={multiline ? 1500 : 300} data-testid={`${testId}-input`} />
        </>
      )}
    </div>
  );
};

export const WordingEditor = ({ card, ev, index, onChange }) => {
  const [open, setOpen] = useState(false);
  const header = cardHeader(card);
  const dua = defaultDua(card, ev);
  const id = `wizard-event-${index}-wording`;
  return (
    <div className="rounded-2xl border border-border/70" data-testid={id}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={open} data-testid={`${id}-toggle`}>
        <span><span className="block text-sm font-semibold text-foreground">{t("wizard.wording")}</span><span className="block text-xs text-muted-foreground">{t("wizard.wordingHint")}</span></span>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border/70 p-4">
          {header && (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{t("wizard.wf.header")} <span className="text-muted-foreground" dir="auto">({header.text})</span></span>
              <Switch checked={!ev.header_hidden} onCheckedChange={(v) => onChange({ header_hidden: !v })} data-testid={`${id}-header-switch`} />
            </label>
          )}
          <Line label={t("wizard.wf.wording")} value={ev.wording} def={defaultWording(card, ev)} onChange={(v) => onChange({ wording: v })} multiline testId={`${id}-text`} />
          {(dua || ev.dua) && <Line label={t("wizard.wf.dua")} value={ev.dua} def={dua} onChange={(v) => onChange({ dua: v })} multiline dir="rtl" testId={`${id}-dua`} />}
          <Line label={t("wizard.wf.closing")} value={ev.closing} def={defaultClosing(card)} onChange={(v) => onChange({ closing: v })} testId={`${id}-closing`}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {CLOSINGS.map((c, i) => (
                <button key={c} type="button" onClick={() => onChange({ closing: c })} data-testid={`${id}-closing-option-${i}`}
                  className={`rounded-full border px-3 py-1 text-xs ${(ev.closing ?? defaultClosing(card)) === c ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          </Line>
          <Line label={t("wizard.wf.concluded")} value={ev.concluded} def={defaultConcluded(card)} onChange={(v) => onChange({ concluded: v })} multiline testId={`${id}-concluded`} />
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("wizard.wf.rsvp_line")}</p>
            <Input value={ev.rsvp_line || ""} onChange={(e) => onChange({ rsvp_line: e.target.value })} maxLength={200} className="h-11 rounded-xl text-base" placeholder="RSVP: Imran +91 98765 43210" data-testid={`${id}-rsvp-line-input`} />
          </div>
        </div>
      )}
    </div>
  );
};
