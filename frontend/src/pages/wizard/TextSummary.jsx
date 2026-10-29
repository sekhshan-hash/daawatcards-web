import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { makeT } from "@/i18n";
import { cardSlots, slotOverlaps } from "@/lib/textSlots";

const useSlots = (card) => useMemo(() => {
  const slots = cardSlots(card, makeT(card.language || "en"));
  return { slots, overlaps: slotOverlaps(slots) };
}, [card]);

export const SlotWarning = ({ card, slot }) => {
  const other = useSlots(card).overlaps[slot];
  return other ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300" data-testid={`slot-warning-${slot}`}>
      <AlertTriangle size={13} /> This wording is already used in {other}.
    </p>
  ) : null;
};

// "Text on your card": every text slot, its wording and the page it appears on.
export const TextSummary = ({ card }) => {
  const { slots, overlaps } = useSlots(card);
  return (
    <div className="mt-8 rounded-2xl border border-border p-4" data-testid="text-summary-panel">
      <p className="text-sm font-semibold text-foreground">Text on your card</p>
      <p className="text-xs text-muted-foreground">Each message appears once, on the page shown.</p>
      <ul className="mt-3 divide-y divide-border">
        {slots.map((s) => (
          <li key={s.key} className="py-3" data-testid={`text-summary-${s.key}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">{s.label}</span>
              <span className="text-[11px] text-muted-foreground">{s.page}</span>
            </div>
            <p className={`mt-1 text-sm ${s.text ? "text-foreground" : "italic text-muted-foreground"}`} dir="auto">{s.text || "Empty, nothing is shown"}</p>
            {s.note && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.note}</p>}
            {overlaps[s.key] && <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-300"><AlertTriangle size={13} /> This wording is already used in {overlaps[s.key]}.</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};
