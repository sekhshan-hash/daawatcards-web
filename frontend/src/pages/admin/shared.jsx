import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { api, errMsg } from "@/lib/api";

export const CAT = { free: "Free", paid: "Paid", paid_without_payment: "Paid (without payment)" };
export const inr = (p) => `Rs. ${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const useAdmin = (url, deps = []) => {
  const [data, setData] = useState(null);
  const load = () => api.get(url).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [url, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return [data, load];
};

export const Bars = ({ rows, label = "period", value = "n", fmt = (v) => v, testId }) => {
  const max = Math.max(1, ...rows.map((r) => r[value]));
  return (
    <div className="flex h-40 items-end gap-1 rounded-2xl border border-border p-3" data-testid={testId}>
      {rows.map((r) => (
        <div key={r[label]} className="group relative flex h-full flex-1 flex-col justify-end" title={`${r[label]}: ${fmt(r[value])}`}>
          <div className="rounded-t bg-gold/70 transition-colors group-hover:bg-gold" style={{ height: `${(r[value] / max) * 100}%`, minHeight: r[value] ? 3 : 0 }} />
        </div>
      ))}
    </div>
  );
};

export const Stat = ({ label, value, testId }) => (
  <div className="rounded-2xl border border-border p-4" data-testid={testId}>
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
  </div>
);

// Required note + optional end date for "Make paid (without payment)".
export const GrantDialog = ({ title, url, onClose, onDone }) => {
  const [note, setNote] = useState("");
  const [until, setUntil] = useState("");
  const save = async () => {
    if (note.trim().length < 2) return toast.error("Add a short reason, e.g. family, promo or partner.");
    try {
      await api.post(url, { note: note.trim(), until });
      toast.success("Paid access granted");
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4" data-testid="grant-dialog">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
        <p className="font-semibold text-foreground">{title}</p>
        <Input placeholder="Reason (required): family, promo, partner…" value={note} onChange={(e) => setNote(e.target.value)} className="h-11 rounded-xl" data-testid="grant-note-input" />
        <label className="block text-xs text-muted-foreground">End date (optional)
          <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="mt-1 h-11 rounded-xl" data-testid="grant-until-input" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={save} className="btn-gold" data-testid="grant-save-button">Make paid (without payment)</button>
          <button type="button" onClick={onClose} className="btn-outline" data-testid="grant-cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  );
};
