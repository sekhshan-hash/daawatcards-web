import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { HostShell, FullLoader } from "@/components/host/HostShell";
import { AgreeTerms } from "@/components/site/AgreeTerms";
import { PlansTable, isPaid, rupees } from "@/components/plans/Plans";
import { api, errMsg } from "@/lib/api";

const loadCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const s = document.createElement("script");
  s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.onload = resolve;
  s.onerror = () => reject(new Error("Could not load Razorpay"));
  document.body.appendChild(s);
});

const MockSheet = ({ order, onResult, onClose }) => (
  <div className="fixed inset-0 z-[80] grid place-items-end bg-black/70 sm:place-items-center" data-testid="mock-checkout">
    <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-slate-900 sm:rounded-3xl">
      <p className="rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800" data-testid="mock-checkout-notice">Test payment, no money is charged</p>
      <p className="mt-5 text-sm text-slate-500">Daawat · {order.name}</p>
      <p className="text-3xl font-bold" data-testid="mock-checkout-amount">{rupees(order.amount)}</p>
      <p className="mt-1 text-xs text-slate-500">Order {order.order_id}</p>
      <div className="mt-6 grid gap-2">
        <button type="button" onClick={() => onResult("success")} className="h-12 rounded-xl bg-emerald-600 font-semibold text-white" data-testid="mock-checkout-success">Simulate success</button>
        <button type="button" onClick={() => onResult("failure")} className="h-12 rounded-xl bg-red-600 font-semibold text-white" data-testid="mock-checkout-failure">Simulate failure</button>
        <button type="button" onClick={onClose} className="h-11 text-sm text-slate-500" data-testid="mock-checkout-close">Cancel</button>
      </div>
    </div>
  </div>
);

export default function Upgrade() {
  const { cardId } = useParams();
  const [info, setInfo] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [order, setOrder] = useState(null);
  const [state, setState] = useState("idle");
  const [paid, setPaid] = useState(null);
  const load = () => api.get(`/billing/cards/${cardId}`).then((r) => setInfo(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async (res) => {
    try {
      const { data } = await api.post("/billing/verify", res);
      setPaid(data);
      setState("success");
      load();
    } catch (e) {
      toast.error(errMsg(e));
      setState("failed");
    }
  };
  const pay = async () => {
    if (!agreed) return toast.error("Please tick “I agree to the Terms and Privacy Policy” first.");
    setState("busy");
    try {
      const { data } = await api.post(`/billing/cards/${cardId}/order`, { agreed_terms: true });
      if (data.mode === "mock") return setOrder(data);
      await loadCheckout();
      const rz = new window.Razorpay({
        key: data.key_id, order_id: data.order_id, amount: data.amount, currency: data.currency, name: "Daawat", description: `Paid plan · ${data.name}`,
        handler: verify, modal: { ondismiss: () => setState("idle") },
      });
      rz.on("payment.failed", () => setState("failed"));
      rz.open();
    } catch (e) {
      toast.error(errMsg(e));
      setState("idle");
    }
  };
  const mockResult = async (outcome) => {
    const o = order;
    setOrder(null);
    try {
      const { data } = await api.post(`/billing/mock/${o.order_id}/${outcome}`);
      if (outcome === "success") await verify(data);
      else setState("failed");
    } catch (e) {
      toast.error(errMsg(e));
      setState("failed");
    }
  };

  if (!info) return <FullLoader />;
  const p = info.price;
  return (
    <HostShell>
      <Link to={`/cards/${cardId}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to card</Link>
      <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl" data-testid="upgrade-title">Upgrade this card</h1>
      {state === "success" ? (
        <div className="mt-8 max-w-lg rounded-2xl border border-gold/40 bg-gold/10 p-6" data-testid="upgrade-success">
          <CheckCircle2 className="text-gold" />
          <p className="mt-3 text-lg font-semibold text-foreground">Payment successful. This card is now Paid.</p>
          <p className="mt-1 text-sm text-muted-foreground">The watermark is gone and you can add any number of guests.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/receipt/${paid.order_id}`} className="btn-gold" data-testid="upgrade-receipt-link">View receipt</Link>
            <Link to={`/cards/${cardId}/guests`} className="btn-outline" data-testid="upgrade-guests-link">Go to guest list</Link>
          </div>
        </div>
      ) : isPaid(info.plan) ? (
        <p className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 text-foreground" data-testid="upgrade-already-paid">This card is already on the Paid plan.</p>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="max-w-md">
            <div className="rounded-2xl border border-border p-6" data-testid="upgrade-breakdown">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid plan (this card, one-time)</span><span data-testid="upgrade-base">{rupees(p.base)}</span></div>
              <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">GST {p.gst_rate}%</span><span data-testid="upgrade-gst">{rupees(p.gst)}</span></div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span data-testid="upgrade-total">{rupees(p.total)}</span></div>
            </div>
            <AgreeTerms checked={agreed} onChange={setAgreed} testId="upgrade-agree-terms" />
            {state === "failed" && (
              <p className="mt-4 flex items-center gap-2 text-sm text-rose" data-testid="upgrade-failed"><XCircle size={16} /> Payment failed. No money was taken. Please try again.</p>
            )}
            <button type="button" onClick={pay} disabled={state === "busy"} className="btn-gold mt-6 w-full justify-center" data-testid="upgrade-pay-button">
              {state === "failed" ? <><RotateCcw size={16} /> Try again · {rupees(p.total)}</> : `Pay ${rupees(p.total)}`}
            </button>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} /> Payments by Razorpay{info.mode === "mock" ? " · test mode, no money is charged" : ""}</p>
          </div>
          <PlansTable price={p} freeLimit={info.limit ?? 2} />
        </div>
      )}
      {order && <MockSheet order={order} onResult={mockResult} onClose={() => { setOrder(null); setState("idle"); }} />}
    </HostShell>
  );
}
