import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookUser, FileUp, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg } from "@/lib/api";
import { cleanPhone, parseFile, parseLines, pickContacts, supportsContacts } from "@/lib/guestImport";
import { EventChips } from "./shared";
import { t } from "@/i18n";

const keyOf = (r) => cleanPhone(r.phone) || r.name.trim().toLowerCase();

const ReviewList = ({ rows, setRows, onAdd, busy, existingKeys, merge, setMerge }) => {
  const set = (i, patch) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const dups = rows.filter((r) => existingKeys.has(keyOf(r))).length;
  return (
    <div className="mt-5 space-y-3" data-testid="add-guests-review">
      <p className="text-sm text-muted-foreground">{t("guests.review")}</p>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border/60 p-2 sm:flex-row sm:flex-wrap sm:border-0 sm:p-0" data-testid={`review-row-${i}`}>
            <Input value={r.name} onChange={(e) => set(i, { name: e.target.value })} dir="auto" className="h-11 flex-1 rounded-xl" aria-label={t("guests.name")} data-testid={`review-row-${i}-name`} />
            <div className="flex gap-2">
              <Input value={r.phone} onChange={(e) => set(i, { phone: e.target.value })} className="h-11 flex-1 rounded-xl sm:w-36" inputMode="tel" aria-label={t("guests.phone")} data-testid={`review-row-${i}-phone`} />
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-rose" aria-label="Remove" data-testid={`review-row-${i}-remove`}><X size={15} /></button>
            </div>
            {existingKeys.has(keyOf(r)) && <p className="w-full text-xs text-amber-300" data-testid={`review-row-${i}-dup`}>{t("guests.dupHint")}</p>}
          </div>
        ))}
      </div>
      {dups > 0 && (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
          {t("guests.dupMerge")}
          <Switch checked={merge} onCheckedChange={setMerge} data-testid="add-guests-merge-switch" />
        </label>
      )}
      <button type="button" onClick={onAdd} disabled={busy || !rows.length} className="btn-gold w-full" data-testid="add-guests-confirm-button">
        {t("guests.addMany", { count: rows.filter((r) => r.name.trim() && !existingKeys.has(keyOf(r))).length })}
      </button>
    </div>
  );
};

export const AddGuestsDialog = ({ open, onOpenChange, card, existing, onAdded, onMerged }) => {
  const [rows, setRows] = useState([]);
  const [merge, setMerge] = useState(false);
  const existingKeys = useMemo(() => new Set(existing.map((g) => g.phone || g.name.toLowerCase())), [existing]);
  const [eventIds, setEventIds] = useState(card.events.map((e) => e.event_id));
  const [one, setOne] = useState({ name: "", phone: "" });
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setEventIds(card.events.map((e) => e.event_id));
  }, [open, card.events]);

  const submit = async (list) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/cards/${card.card_id}/guests/bulk`, { guests: list.map((r) => ({ name: r.name, phone: r.phone, event_ids: eventIds })), on_duplicate: merge ? "merge" : "skip" });
      toast.success(t(data.merged ? "guests.addedMerged" : "guests.added", data));
      onAdded(data.guests);
      if (data.merged) onMerged();
      return true;
    } catch (e) {
      toast.error(errMsg(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const addOne = async (e) => {
    e.preventDefault();
    if (one.name.trim() && (await submit([one]))) setOne({ name: "", phone: "" });
  };
  const addRows = async () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length && (await submit(valid))) {
      setRows([]);
      setPaste("");
      onOpenChange(false);
    }
  };
  const load = (list) => {
    if (!list.length) return toast.error(t("guests.nothingFound"));
    const seen = new Set(rows.map(keyOf));
    const fresh = list.filter((r) => !seen.has(keyOf(r)) && seen.add(keyOf(r)));
    const removed = list.length - fresh.length;
    if (removed) toast(t(removed === 1 ? "guests.reviewDedupedOne" : "guests.reviewDeduped", { count: removed }));
    setRows([...rows, ...fresh]);
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) load(await parseFile(f));
  };
  const onContacts = async () => {
    try {
      load(await pickContacts());
    } catch { /* picker closed */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl" data-testid="add-guests-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("guests.add")}</DialogTitle>
          <DialogDescription>{t("guests.subtitle")}</DialogDescription>
        </DialogHeader>
        <EventChips card={card} value={eventIds} onChange={setEventIds} testId="add-guests-events" />
        <Tabs defaultValue="one" className="mt-2">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            {["one", "paste", "file", "contacts"].map((k) => <TabsTrigger key={k} value={k} className="py-2 text-xs" data-testid={`add-guests-tab-${k}`}>{t(`guests.tabs.${k}`)}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="one">
            <form onSubmit={addOne} className="mt-3 space-y-3">
              <Input placeholder={t("guests.name")} value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} dir="auto" className="h-12 rounded-xl text-base" maxLength={80} data-testid="add-guest-name-input" />
              <Input placeholder={t("guests.phone")} value={one.phone} onChange={(e) => setOne({ ...one, phone: e.target.value })} className="h-12 rounded-xl text-base" inputMode="tel" data-testid="add-guest-phone-input" />
              <button type="submit" disabled={busy || !one.name.trim()} className="btn-gold w-full" data-testid="add-guest-submit-button">{t("guests.addOne")}</button>
            </form>
          </TabsContent>
          <TabsContent value="paste">
            <p className="mt-3 text-sm text-muted-foreground">{t("guests.pasteHint")}</p>
            <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} className="mt-3 min-h-36 rounded-xl text-base" placeholder={"Ali Khan, 98765 43210\nSara Ahmed\t+91 99887 76655\nRahul Verma"} data-testid="add-guests-paste-input" />
            <button type="button" onClick={() => load(parseLines(paste))} disabled={!paste.trim()} className="btn-outline mt-3 w-full" data-testid="add-guests-paste-preview-button">{t("guests.pastePreview")}</button>
          </TabsContent>
          <TabsContent value="file">
            <p className="mt-3 text-sm text-muted-foreground">{t("guests.fileHint")}</p>
            <label className="btn-outline mt-3 w-full cursor-pointer">
              <FileUp size={16} /> {t("guests.chooseFile")}
              <input type="file" accept=".csv,.vcf,text/csv,text/vcard,text/x-vcard" hidden onChange={onFile} data-testid="add-guests-file-input" />
            </label>
          </TabsContent>
          <TabsContent value="contacts">
            <p className="mt-3 text-sm text-muted-foreground">{supportsContacts() ? t("guests.contactsHint") : t("guests.contactsUnsupported")}</p>
            {supportsContacts() && <button type="button" onClick={onContacts} className="btn-outline mt-3 w-full" data-testid="add-guests-contacts-button"><BookUser size={16} /> {t("guests.contactsPick")}</button>}
          </TabsContent>
        </Tabs>
        {rows.length > 0 && <ReviewList rows={rows} setRows={setRows} onAdd={addRows} busy={busy} existingKeys={existingKeys} merge={merge} setMerge={setMerge} />}
      </DialogContent>
    </Dialog>
  );
};
