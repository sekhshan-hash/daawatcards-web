import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Mail, MapPin, PhoneCall } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg } from "@/lib/api";
import { PublicShell, useSite } from "@/components/site/SiteShell";
import { t } from "@/i18n";

const TIMES = ["morning", "afternoon", "evening"];
const validMobile = (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""));

const Info = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3">
    <Icon size={18} className="mt-0.5 shrink-0 text-gold" />
    <div><p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p><div className="mt-1 whitespace-pre-line text-foreground">{children}</div></div>
  </div>
);

const CallbackForm = () => {
  const started = useRef(Date.now());
  const [f, setF] = useState({ name: "", mobile: "", time: "morning", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!validMobile(f.mobile)) return toast.error(t("site.badMobile"));
    setBusy(true);
    try {
      await api.post("/support/callback", { ...f, elapsed_ms: Date.now() - started.current });
      setDone(true);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  if (done) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6" data-testid="callback-success">
        <CheckCircle2 className="text-gold" />
        <p className="mt-3 font-semibold text-foreground">{t("site.cbThanks")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("site.cbThanksBody")}</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border p-6" data-testid="callback-form">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><PhoneCall size={18} className="text-gold" /> {t("site.cbTitle")}</h2>
      <label className="block"><span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{t("site.cbName")}</span>
        <Input required maxLength={80} value={f.name} onChange={set("name")} className="h-12 rounded-xl" data-testid="callback-name-input" /></label>
      <label className="block"><span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{t("site.cbMobile")}</span>
        <Input required type="tel" inputMode="tel" maxLength={16} placeholder="98765 43210" value={f.mobile} onChange={set("mobile")} className="h-12 rounded-xl" data-testid="callback-mobile-input" /></label>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">{t("site.cbTime")}</p>
        <div className="flex flex-wrap gap-2" data-testid="callback-time">
          {TIMES.map((k) => (
            <button key={k} type="button" onClick={() => setF({ ...f, time: k })} data-testid={`callback-time-${k}`}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${f.time === k ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t(`site.times.${k}`)}
            </button>
          ))}
        </div>
      </div>
      <label className="block"><span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{t("site.cbMessage")}</span>
        <Textarea maxLength={500} value={f.message} onChange={set("message")} className="min-h-24 rounded-xl" data-testid="callback-message-input" /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} className="hidden" aria-hidden="true" />
      <button type="submit" disabled={busy} className="btn-gold w-full" data-testid="callback-submit-button">{t("site.cbSubmit")}</button>
    </form>
  );
};

export default function Contact() {
  const site = useSite();
  return (
    <PublicShell>
      <h1 className="font-display text-4xl text-foreground sm:text-5xl" data-testid="contact-title">{t("site.titles.contact")}</h1>
      <p className="mt-3 text-muted-foreground">{t("site.contactIntro")}</p>
      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6" data-testid="contact-details">
          <p className="font-display text-2xl text-gold" data-testid="contact-company">{site?.company}</p>
          <Info icon={Mail} label={t("site.email")}>
            <a href={`mailto:${site?.email}`} className="text-gold underline underline-offset-2" data-testid="contact-email-link">{site?.email}</a>
          </Info>
          <Info icon={MapPin} label={t("site.address")}><span data-testid="contact-address">{site?.address}</span></Info>
          <Info icon={Clock} label={t("site.hours")}><span data-testid="contact-hours">{site?.hours}</span></Info>
        </div>
        <CallbackForm />
      </div>
    </PublicShell>
  );
}
