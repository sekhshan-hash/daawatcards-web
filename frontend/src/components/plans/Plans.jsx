import { Link } from "react-router-dom";
import { Check, Sparkles, X } from "lucide-react";

export const isPaid = (plan) => plan === "paid" || plan === "paid_without_payment";
export const rupees = (paise) => `Rs. ${(paise / 100).toFixed(2)}`;

export const PlanBadge = ({ plan, testId = "plan-badge" }) => (
  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${isPaid(plan) ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`} data-testid={testId}>
    {isPaid(plan) ? "Paid" : "Free"}
  </span>
);

export const UpgradeButton = ({ cardId, plan, className = "btn-gold", testId = "upgrade-card-button" }) => (isPaid(plan) ? null : (
  <Link to={`/cards/${cardId}/upgrade`} className={className} data-testid={testId}><Sparkles size={15} /> Upgrade this card</Link>
));

const ROWS = [
  ["Create, edit and preview the full card", true, true],
  ["All templates, events, photo, music and effects", true, true],
  ["Guests and personal links", "free", "Unlimited"],
  ["Contacts import, CSV and bulk send", false, true],
  ["Watermark on every page and the WhatsApp preview", "Large watermark", "No watermark"],
];

const Cell = ({ v }) => (v === true ? <Check size={16} className="text-gold" /> : v === false ? <X size={16} className="text-muted-foreground" /> : <span>{v}</span>);

export const PlansTable = ({ price, freeLimit = 2 }) => (
  <div className="overflow-hidden rounded-2xl border border-border" data-testid="plans-table">
    <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-card/60 text-sm">
      <span className="p-4" />
      <span className="p-4 font-semibold text-foreground">Free<span className="block text-xs font-normal text-muted-foreground">Rs. 0</span></span>
      <span className="p-4 font-semibold text-gold">Paid<span className="block text-xs font-normal text-muted-foreground">{price ? `${rupees(price.base)} + ${price.gst_rate}% GST, per card` : "Rs. 99 + GST"}</span></span>
    </div>
    {ROWS.map(([label, free, paid]) => (
      <div key={label} className="grid grid-cols-[1.6fr_1fr_1fr] border-t border-border text-sm">
        <span className="p-4 text-muted-foreground">{label}</span>
        <span className="p-4 text-foreground"><Cell v={free === "free" ? `Up to ${freeLimit}` : free} /></span>
        <span className="p-4 text-foreground"><Cell v={paid} /></span>
      </div>
    ))}
  </div>
);
