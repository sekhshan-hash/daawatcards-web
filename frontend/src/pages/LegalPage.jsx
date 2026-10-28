import { Link } from "react-router-dom";
import { PublicShell, useSite } from "@/components/site/SiteShell";
import { t } from "@/i18n";

const HEAD = /^(\d+\.\s[^.]+\.)\s?(.*)$/s;
const LABEL = /^([A-Z][^:.]{1,40}:)\s?(.*)$/s;

const Para = ({ text, i }) => {
  const m = text.match(HEAD) || text.match(LABEL);
  return (
    <p className="leading-relaxed text-muted-foreground" data-testid={`legal-para-${i}`}>
      {m ? <><strong className="font-semibold text-foreground">{m[1]}</strong> {m[2]}</> : text}
    </p>
  );
};

export default function LegalPage({ page }) {
  const site = useSite();
  const body = site?.pages?.[page] || "";
  return (
    <PublicShell>
      <h1 className="font-display text-4xl text-foreground sm:text-5xl" data-testid="legal-title">{t(`site.titles.${page}`)}</h1>
      {page !== "pricing" && site?.updated && <p className="mt-3 text-sm text-muted-foreground" data-testid="legal-updated">{t("site.lastUpdated", { date: site.updated })}</p>}
      <div className="mt-10 space-y-5 text-base" data-testid={`legal-body-${page}`}>
        {site ? body.split(/\n\s*\n/).map((p, i) => <Para key={i} i={i} text={p.trim()} />) : <div className="loader-ring" />}
      </div>
      {page === "pricing" && <Link to="/login" className="btn-gold mt-10" data-testid="pricing-start-button">{t("landing.ctaCreate")}</Link>}
      <p className="mt-12 text-sm text-muted-foreground">
        {t("site.questions")} <Link to="/contact" className="text-gold underline underline-offset-2" data-testid="legal-contact-link">{t("site.nav.contact")}</Link>
      </p>
    </PublicShell>
  );
}
