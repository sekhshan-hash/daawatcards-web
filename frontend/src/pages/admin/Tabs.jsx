import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { api, API, errMsg } from "@/lib/api";
import { Bars, CAT, GrantDialog, Stat, inr, useAdmin } from "./shared";

const btn = "btn-chip";

export const Overview = () => {
  const [d] = useAdmin("/admin/overview");
  if (!d) return <div className="loader-ring" />;
  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total users" value={d.users} testId="admin-stat-users" />
        {Object.entries(CAT).map(([k, l]) => <Stat key={k} label={`${l} users`} value={d.categories[k]} testId={`admin-stat-users-${k}`} />)}
      </div>
      <p className="text-sm text-muted-foreground">Users by plan: Free · Paid · Paid (without payment)</p>
      <Bars rows={Object.entries(CAT).map(([k, l]) => ({ period: l, n: d.categories[k] }))} testId="admin-chart-categories" />
      <p className="text-sm text-muted-foreground">New users per day (last 30 days)</p>
      <Bars rows={d.new_users} label="day" testId="admin-chart-new-users" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(CAT).map(([k, l]) => <Stat key={k} label={`${l} cards`} value={d.cards[k]} testId={`admin-stat-cards-${k}`} />)}
      </div>
      <p className="text-xs text-muted-foreground" data-testid="admin-payment-mode">Payment mode: {d.mode.toUpperCase()}</p>
    </div>
  );
};

export const Users = () => {
  const [q, setQ] = useState("");
  const [rows, load] = useAdmin(`/admin/users?q=${encodeURIComponent(q)}`);
  const [grant, setGrant] = useState(null);
  const revoke = (u) => api.post(`/admin/users/${u.user_id}/revoke`).then(() => { toast.success("Revoked"); load(); }).catch((e) => toast.error(errMsg(e)));
  return (
    <div className="space-y-4" data-testid="admin-users">
      <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 max-w-sm rounded-xl" data-testid="admin-users-search" />
      {!rows ? <div className="loader-ring" /> : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {rows.map((u) => (
            <li key={u.user_id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm" data-testid={`admin-user-${u.user_id}`}>
              <div>
                <p className="font-semibold text-foreground">{u.name} <span className="font-normal text-muted-foreground">{u.email}</span></p>
                <p className="text-muted-foreground">Joined {String(u.created_at).slice(0, 10)} · {u.cards} cards · <span data-testid={`admin-user-cat-${u.user_id}`}>{CAT[u.category]}</span>
                  {u.account_grant && ` · account grant: ${u.account_grant.note}${u.account_grant.until ? ` until ${u.account_grant.until}` : ""}`}</p>
              </div>
              {u.account_grant
                ? <button type="button" className={btn} onClick={() => revoke(u)} data-testid={`admin-user-revoke-${u.user_id}`}>Revoke</button>
                : <button type="button" className={btn} onClick={() => setGrant(u)} data-testid={`admin-user-grant-${u.user_id}`}>Make paid (without payment), all cards</button>}
            </li>
          ))}
        </ul>
      )}
      {grant && <GrantDialog title={`All cards of ${grant.email}, current and future`} url={`/admin/users/${grant.user_id}/grant`} onClose={() => setGrant(null)} onDone={() => { setGrant(null); load(); }} />}
    </div>
  );
};

export const Cards = () => {
  const [plan, setPlan] = useState("");
  const [rows, load] = useAdmin(`/admin/cards?plan=${plan}`);
  const [grant, setGrant] = useState(null);
  const act = (p, msg) => p.then(() => { toast.success(msg); load(); }).catch((e) => toast.error(errMsg(e)));
  return (
    <div className="space-y-4" data-testid="admin-cards">
      <div className="flex flex-wrap gap-2">
        {[["", "All"], ...Object.entries(CAT)].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setPlan(k)} className={`rounded-full border px-4 py-1.5 text-xs ${plan === k ? "border-gold text-gold" : "border-border text-muted-foreground"}`} data-testid={`admin-cards-filter-${k || "all"}`}>{l}</button>
        ))}
      </div>
      {!rows ? <div className="loader-ring" /> : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {rows.map((c) => (
            <li key={c.card_id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm" data-testid={`admin-card-${c.card_id}`}>
              <div>
                <p className="font-semibold text-foreground">{[c.primary_name, c.secondary_name].filter(Boolean).join(" & ")} {c.disabled && <span className="text-rose">(disabled)</span>}</p>
                <p className="text-muted-foreground">{c.owner_email} · {CAT[c.plan]} · {c.template} · {String(c.created_at).slice(0, 10)}{c.grant?.note ? ` · ${c.grant.note}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`/i/${c.slug}`} target="_blank" rel="noreferrer" className={btn} data-testid={`admin-card-open-${c.card_id}`}>Open</a>
                {c.plan === "free" && <button type="button" className={btn} onClick={() => setGrant(c)} data-testid={`admin-card-grant-${c.card_id}`}>Make paid (without payment)</button>}
                {c.plan === "paid_without_payment" && <button type="button" className={btn} onClick={() => act(api.post(`/admin/cards/${c.card_id}/revoke`), "Revoked")} data-testid={`admin-card-revoke-${c.card_id}`}>Revoke</button>}
                <button type="button" className={btn} onClick={() => act(api.patch(`/admin/cards/${c.card_id}`, { disabled: !c.disabled }), c.disabled ? "Enabled" : "Disabled")} data-testid={`admin-card-disable-${c.card_id}`}>{c.disabled ? "Enable" : "Disable"}</button>
                <button type="button" className={`${btn} text-rose`} onClick={() => window.confirm("Delete this card and its guests?") && act(api.delete(`/admin/cards/${c.card_id}`), "Deleted")} data-testid={`admin-card-delete-${c.card_id}`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {grant && <GrantDialog title="This card only" url={`/admin/cards/${grant.card_id}/grant`} onClose={() => setGrant(null)} onDone={() => { setGrant(null); load(); }} />}
    </div>
  );
};

export const FreeEvents = () => {
  const [rows] = useAdmin("/admin/free-events");
  if (!rows) return <div className="loader-ring" />;
  if (!rows.length) return <p className="text-muted-foreground" data-testid="admin-events-empty">No upcoming events on free cards.</p>;
  return (
    <table className="w-full text-left text-sm" data-testid="admin-free-events">
      <thead className="text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="p-2">Card</th><th className="p-2">Occasion</th><th className="p-2">Event dates</th><th className="p-2">Days left</th><th className="p-2">Host</th></tr></thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.card_id} className={`border-t border-border ${c.days_left <= 7 ? "bg-gold/10" : ""}`} data-testid={`admin-event-${c.card_id}`}>
            <td className="p-2 text-foreground">{[c.primary_name, c.secondary_name].filter(Boolean).join(" & ")}</td>
            <td className="p-2">{c.event_type}</td><td className="p-2">{c.dates.join(", ")}</td>
            <td className={`p-2 ${c.days_left <= 7 ? "font-semibold text-gold" : ""}`}>{c.days_left}</td><td className="p-2">{c.owner_email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const Revenue = () => {
  const [f, setF] = useState({ start: "", end: "", mock: false });
  const qs = `start=${f.start}&end=${f.end}&include_mock=${f.mock}`;
  const [d] = useAdmin(`/admin/revenue?${qs}`);
  const [view, setView] = useState("daily");
  return (
    <div className="space-y-5" data-testid="admin-revenue">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">From<Input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} className="mt-1 h-10 rounded-xl" data-testid="admin-revenue-start" /></label>
        <label className="text-xs text-muted-foreground">To<Input type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} className="mt-1 h-10 rounded-xl" data-testid="admin-revenue-end" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.mock} onChange={(e) => setF({ ...f, mock: e.target.checked })} data-testid="admin-revenue-show-mock" /> Show mock payments in the list</label>
        <a href={`${API}/admin/revenue.csv?${qs}`} className="btn-outline" data-testid="admin-revenue-csv">Export CSV</a>
      </div>
      {!d ? <div className="loader-ring" /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Revenue (total)" value={inr(d.totals.total)} testId="admin-revenue-total" />
            <Stat label="Base" value={inr(d.totals.base)} testId="admin-revenue-base" />
            <Stat label="GST" value={inr(d.totals.gst)} testId="admin-revenue-gst" />
            <Stat label="Paid (without payment) cards" value={d.paid_without_payment_cards} testId="admin-revenue-pwp" />
          </div>
          <div className="flex gap-2">{["daily", "monthly", "yearly"].map((k) => <button key={k} type="button" onClick={() => setView(k)} className={`rounded-full border px-4 py-1.5 text-xs ${view === k ? "border-gold text-gold" : "border-border text-muted-foreground"}`} data-testid={`admin-revenue-${k}`}>{k}</button>)}</div>
          {d[view].length ? <Bars rows={d[view]} value="total" fmt={inr} testId="admin-revenue-chart" /> : <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground" data-testid="admin-revenue-empty">No real revenue in this period yet. Mock payments are never counted.</p>}
          <ul className="divide-y divide-border rounded-2xl border border-border text-sm" data-testid="admin-payments-list">
            {d.payments.map((p) => (
              <li key={p.order_id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>{p.paid_at.slice(0, 10)} · {p.invoice_no} · {p.host_email} · {p.card_name}</span>
                <span>{inr(p.total)} {p.mode === "mock" && <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-300" data-testid={`admin-payment-mock-${p.order_id}`}>Mock</span>}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export const Audit = () => {
  const [rows] = useAdmin("/admin/audit");
  if (!rows) return <div className="loader-ring" />;
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border text-sm" data-testid="admin-audit">
      {rows.map((a, i) => <li key={i} className="p-3 text-muted-foreground">{a.at.slice(0, 16).replace("T", " ")} · <span className="text-foreground">{a.admin}</span> · {a.action} · {a.target}{a.note ? ` · ${a.note}` : ""}</li>)}
    </ul>
  );
};
