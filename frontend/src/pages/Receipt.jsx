import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { HostShell, FullLoader } from "@/components/host/HostShell";
import { useSite } from "@/components/site/SiteShell";
import { rupees } from "@/components/plans/Plans";
import { api, API } from "@/lib/api";

export default function Receipt() {
  const { orderId } = useParams();
  const site = useSite();
  const [p, setP] = useState(null);
  useEffect(() => { api.get(`/billing/payments/${orderId}`).then((r) => setP(r.data)).catch(() => setP(false)); }, [orderId]);
  if (p === null) return <FullLoader />;
  if (!p) return <HostShell><p className="text-muted-foreground">Receipt not found.</p></HostShell>;
  const row = (k, v, testId) => <div className="flex justify-between gap-4 py-2 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-right text-foreground" data-testid={testId}>{v}</span></div>;
  return (
    <HostShell>
      <Link to={`/cards/${p.card_id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to card</Link>
      <div className="mt-6 max-w-lg rounded-2xl border border-border p-6" data-testid="receipt">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl text-foreground">Receipt</h1>
          {p.mode === "mock" && <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300" data-testid="receipt-mock-tag">Mock</span>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{site?.company}{site?.gstin ? ` · GSTIN ${site.gstin}` : ""}</p>
        <div className="mt-5 divide-y divide-border">
          {row("Invoice number", p.invoice_no || "—", "receipt-invoice-no")}
          {row("Date", (p.paid_at || p.created_at).slice(0, 10), "receipt-date")}
          {row("Host", p.host_name || p.host_email, "receipt-host")}
          {row("Card", p.card_name, "receipt-card")}
          {row("Paid plan", rupees(p.base), "receipt-base")}
          {row(`GST ${p.gst_rate}%`, rupees(p.gst), "receipt-gst")}
          {row("Total", rupees(p.total), "receipt-total")}
          {row("Status", p.status, "receipt-status")}
        </div>
        {p.status === "captured" && (
          <a href={`${API}/billing/payments/${p.order_id}/invoice.pdf`} className="btn-gold mt-6" data-testid="receipt-download-pdf"><Download size={15} /> Download PDF invoice</a>
        )}
      </div>
    </HostShell>
  );
}
