import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { loadFont } from "@/templates/registry";
import { HEADERS, SCRIPT_FONTS, TRADITIONS } from "@/i18n/traditions";
import { t } from "@/i18n";

const SCRIPTS = ["latin", "deva", "arabic", "guru", "other"];
const scriptCls = (s) => `script-${s || "latin"}`;
const dirOf = (s) => (s === "arabic" ? "rtl" : "auto");
export const BLANK_HEADER = { text: "", sub: "", script: "latin", size: "m", color: "gold" };

const useScriptFonts = () => useEffect(() => Object.entries(SCRIPT_FONTS).forEach(([k, href]) => loadFont(`script-${k}`, href)), []);

const LinePreview = ({ h }) => (h ? (
  <span className="block min-w-0">
    <span className={`block text-lg leading-snug text-gold ${scriptCls(h.script)}`} dir={dirOf(h.script)}>{h.text}</span>
    {h.sub && <span className="mt-0.5 block text-xs italic text-muted-foreground">{h.sub}</span>}
  </span>
) : <span className="text-sm text-muted-foreground">{t("wizard.headerNone")}</span>);

// Box 1: ready-made header line as a dropdown grouped by tradition (card's tradition first and open).
export const HeaderDropdown = ({ tradition, value, fallback, onChange, disabled, testId }) => {
  useScriptFonts();
  const [open, setOpen] = useState(false);
  const order = [tradition, ...TRADITIONS.filter((x) => x !== tradition)].filter((x) => x !== "neutral" || tradition === "neutral");
  const [expanded, setExpanded] = useState(tradition);
  const all = Object.values(HEADERS).flat();
  const current = value === "none" ? null : all.find((h) => h.id === value) || fallback;
  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setExpanded(tradition); }}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} data-testid={testId}
          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${disabled ? "border-border opacity-50" : "border-border hover:border-gold/50"} ${open ? "border-gold ring-2 ring-gold/30" : ""}`}>
          <span className="flex-1"><LinePreview h={current} /></span>
          {disabled && <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold" data-testid={`${testId}-custom-active`}>{t("wizard.usingCustom")}</span>}
          <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[60vh] w-[var(--radix-popover-trigger-width)] overflow-y-auto p-2" data-testid={`${testId}-list`}>
        {order.map((tr) => (
          <div key={tr} className="mb-1">
            <button type="button" onClick={() => setExpanded(expanded === tr ? "" : tr)} aria-expanded={expanded === tr} data-testid={`${testId}-group-${tr}`}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary">
              {t(`wizard.traditions.${tr}`)}
              <ChevronDown size={14} className={`transition-transform ${expanded === tr ? "rotate-180" : ""}`} />
            </button>
            {expanded === tr && HEADERS[tr].map((h) => (
              <button key={h.id} type="button" onClick={() => pick(h.id)} data-testid={`${testId}-option-${h.id}`}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-secondary ${current?.id === h.id ? "bg-gold/10" : ""}`}>
                <span className="flex-1"><LinePreview h={h} /></span>
                {current?.id === h.id && <Check size={16} className="text-gold" />}
              </button>
            ))}
          </div>
        ))}
        <button type="button" onClick={() => pick("none")} data-testid={`${testId}-option-none`}
          className={`mt-1 flex min-h-12 w-full items-center justify-between rounded-xl border-t border-border px-3 py-2.5 text-left text-sm hover:bg-secondary ${!current ? "bg-gold/10" : ""}`}>
          {t("wizard.headerNone")}
          {!current && <Check size={16} className="text-gold" />}
        </button>
      </PopoverContent>
    </Popover>
  );
};

const Seg = ({ options, value, onChange, testId }) => (
  <div className="inline-flex flex-wrap gap-1.5" data-testid={testId}>
    {options.map(([v, label]) => (
      <button key={v} type="button" onClick={() => onChange(v)} data-testid={`${testId}-${v}`}
        className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${value === v ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>{label}</button>
    ))}
  </div>
);

// Box 2: the host's own header line; replaces Box 1 whenever it has text. Collapsed unless it already has text.
export const CustomHeaderBox = ({ value, onChange, testId }) => {
  const v = { ...BLANK_HEADER, ...(value || {}) };
  const set = (patch) => onChange({ ...v, ...patch });
  const active = !!v.text.trim();
  const [open, setOpen] = useState(active);
  useEffect(() => { if (active) setOpen(true); }, [active]);
  return (
    <div className={`rounded-2xl border transition-colors ${open ? "border-gold/40" : "border-border"}`} data-testid={testId}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid={`${testId}-toggle`}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="flex-1 text-sm font-semibold text-foreground">{t("wizard.customHeaderTitle")}</span>
        {active && <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold" data-testid={`${testId}-active-badge`}>{t("wizard.usingCustom")}</span>}
        <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }} inert={!open} data-testid={`${testId}-panel`}>
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4">
            <p className="text-xs text-muted-foreground">{t("wizard.customHeaderHint")}</p>
      <Input value={v.text} onChange={(e) => set({ text: e.target.value })} maxLength={120} dir={dirOf(v.script)}
        className={`h-12 rounded-xl text-base ${scriptCls(v.script)}`} placeholder={t("wizard.customHeaderPlaceholder")} data-testid={`${testId}-text-input`} />
      <Seg options={SCRIPTS.map((s) => [s, t(`wizard.scripts.${s}`)])} value={v.script} onChange={(s) => set({ script: s })} testId={`${testId}-script`} />
      <Input value={v.sub} onChange={(e) => set({ sub: e.target.value })} maxLength={160} className="h-11 rounded-xl text-sm" placeholder={t("wizard.customHeaderSub")} data-testid={`${testId}-sub-input`} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Seg options={[["s", t("wizard.sizeS")], ["m", t("wizard.sizeM")], ["l", t("wizard.sizeL")]]} value={v.size} onChange={(s) => set({ size: s })} testId={`${testId}-size`} />
        <Seg options={[["gold", t("wizard.colorGold")], ["white", t("wizard.colorWhite")]]} value={v.color} onChange={(c) => set({ color: c })} testId={`${testId}-color`} />
      </div>
      {v.text.trim() && (
        <button type="button" onClick={() => onChange({ ...BLANK_HEADER })} className="btn-chip text-rose" data-testid={`${testId}-clear`}><X size={14} /> {t("wizard.clearCustom")}</button>
      )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HeaderBoxes = ({ tradition, fallback, keyValue, custom, onKey, onCustom, testId }) => (
  <div className="space-y-3">
    <HeaderDropdown tradition={tradition} value={keyValue} fallback={fallback} onChange={onKey} disabled={!!custom?.text?.trim()} testId={`${testId}-dropdown`} />
    <CustomHeaderBox value={custom} onChange={onCustom} testId={`${testId}-custom`} />
  </div>
);
