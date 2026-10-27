import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { guestPath } from "@/lib/links";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/useMedia";
import { BrandMark, PhoneFrame } from "@/components/host/HostShell";
import { GuestCard } from "@/card/GuestCard";
import { TEMPLATES } from "@/templates/registry";
import { t } from "@/i18n";
import { BRAND } from "@/config/brand";

const DEMOS = [
  { slug: "demo-shahnawaz-farah", tpl: "wedding-royal", guest: "Honoured Guest", img: "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?crop=entropy&cs=srgb&fm=jpg&q=80&w=900" },
  { slug: "zara-turns-7", tpl: "birthday-playful", guest: "Little Explorer", img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?crop=entropy&cs=srgb&fm=jpg&q=80&w=900" },
];

const LivePreview = () => {
  const [card, setCard] = useState(null);
  const [eventId, setEventId] = useState("e2");
  useEffect(() => { api.get("/public/cards/demo-shahnawaz-farah").then((r) => setCard(r.data)).catch(() => {}); }, []);
  return (
    <div className="relative">
      <PhoneFrame>{card ? <GuestCard card={card} eventId={eventId} guestName="Honoured Guest" onSelectEvent={setEventId} /> : <div className="h-full bg-[#2B070C]" />}</PhoneFrame>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Sparkles size={14} className="text-gold" /> {t("landing.tryHint")}</p>
    </div>
  );
};

export default function Landing() {
  const { user } = useAuth();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const steps = t("landing.steps");
  const start = user ? "/create" : "/login";

  return (
    <div className="host-app min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <BrandMark />
        <Link to={user ? "/dashboard" : "/login"} className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary" data-testid="landing-login-link">
          {user ? t("dashboard.title") : "Log in"}
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("landing.eyebrow")}</p>
          <h1 className="mt-6 font-display text-4xl leading-[1.1] text-foreground sm:text-5xl lg:text-6xl" data-testid="landing-hero-title">{t("landing.title")}</h1>
          <p className="mt-6 max-w-lg text-base text-muted-foreground md:text-lg">{t("landing.subtitle")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={start} className="btn-gold" data-testid="landing-create-card-button">{t("landing.ctaCreate")} <ArrowRight size={17} /></Link>
            <Link to={guestPath("demo-shahnawaz-farah", "e1", "Honoured Guest")} className="btn-outline" data-testid="landing-demo-wedding-link">{t("landing.ctaDemo")}</Link>
            <Link to={guestPath("zara-turns-7", "e1", "Little Explorer")} className="btn-outline" data-testid="landing-demo-birthday-link">{t("landing.ctaDemoBirthday")}</Link>
          </div>
        </div>
        {desktop && <LivePreview />}
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{t("landing.howTitle")}</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                <span className="font-mono text-sm text-gold">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">{t("landing.templatesTitle")}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {DEMOS.map((d) => (
            <Link key={d.slug} to={guestPath(d.slug, "e1", d.guest)} className="group relative block h-80 overflow-hidden rounded-3xl border border-border" data-testid={`landing-template-${d.tpl}`}>
              <img src={d.img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${TEMPLATES[d.tpl].swatch[0]} 15%, transparent 85%)` }} />
              <div className="absolute bottom-0 p-7">
                <div className="mb-3 flex gap-1.5">{TEMPLATES[d.tpl].swatch.map((c) => <span key={c} className="h-3 w-3 rounded-full border border-white/30" style={{ background: c }} />)}</div>
                <h3 className="font-display text-2xl text-white">{t(`templates.${d.tpl}.name`)}</h3>
                <p className="mt-2 max-w-sm text-sm text-white/80">{t(`templates.${d.tpl}.desc`)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        {BRAND.name} · {t("landing.footer")}
      </footer>
    </div>
  );
}
