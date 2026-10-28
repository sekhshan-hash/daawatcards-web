import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HostShell } from "@/components/host/HostShell";
import { clearSiteCache } from "@/components/site/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { api, errMsg } from "@/lib/api";
import { t } from "@/i18n";

const SHORT = ["company", "email", "address", "hours", "updated"];
const LONG = ["terms", "privacy", "refund", "pricing"];

const Settings = () => {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)).catch((e) => toast.error(errMsg(e))); }, []);
  if (!s) return <div className="loader-ring" />;
  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings", s);
      setS(data);
      clearSiteCache();
      toast.success(t("wizard.saved"));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5" data-testid="admin-settings">
      {SHORT.map((k) => (
        <label key={k} className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{t(`site.fields.${k}`)}</span>
          {k === "address"
            ? <Textarea value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} className="min-h-20 rounded-xl" data-testid={`admin-field-${k}`} />
            : <Input value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} className="h-12 rounded-xl" data-testid={`admin-field-${k}`} />}
        </label>
      ))}
      <p className="text-xs text-muted-foreground">{t("site.placeholdersHint")}</p>
      {LONG.map((k) => (
        <label key={k} className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{t(`site.titles.${k}`)}</span>
          <Textarea value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} className="min-h-64 rounded-xl font-mono text-xs" data-testid={`admin-field-${k}`} />
        </label>
      ))}
      <button type="button" disabled={busy} onClick={save} className="btn-gold" data-testid="admin-settings-save">{t("wizard.saveChanges")}</button>
    </div>
  );
};

const Support = () => {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get("/admin/callbacks").then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))); }, []);
  const mark = async (r) => {
    const status = r.status === "done" ? "new" : "done";
    await api.patch(`/admin/callbacks/${r.request_id}`, { status });
    setRows(rows.map((x) => (x.request_id === r.request_id ? { ...x, status } : x)));
  };
  if (!rows) return <div className="loader-ring" />;
  if (!rows.length) return <p className="text-muted-foreground" data-testid="admin-support-empty">{t("site.noRequests")}</p>;
  return (
    <ul className="space-y-3" data-testid="admin-support-list">
      {rows.map((r) => (
        <li key={r.request_id} className={`rounded-2xl border border-border p-4 ${r.status === "done" ? "opacity-60" : ""}`} data-testid={`admin-request-${r.request_id}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-foreground">{r.name} · <a href={`tel:${r.mobile}`} className="text-gold">{r.mobile}</a></p>
            <button type="button" onClick={() => mark(r)} className="btn-chip" data-testid={`admin-request-toggle-${r.request_id}`}>
              {r.status === "done" ? t("site.markNew") : t("site.markDone")}
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t(`site.times.${r.time}`)} · {new Date(r.created_at).toLocaleString("en-IN")}</p>
          {r.message && <p className="mt-2 text-sm text-foreground">{r.message}</p>}
        </li>
      ))}
    </ul>
  );
};

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("support");
  if (!user?.is_admin) return <Navigate to="/dashboard" replace />;
  return (
    <HostShell>
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("site.admin")}</h1>
      <div className="my-8 flex gap-2">
        {["support", "settings"].map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} data-testid={`admin-tab-${k}`}
            className={`rounded-full border px-5 py-2 text-sm ${tab === k ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"}`}>{t(`site.tabs.${k}`)}</button>
        ))}
      </div>
      {tab === "support" ? <Support /> : <Settings />}
    </HostShell>
  );
}
