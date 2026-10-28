import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { t } from "@/i18n";

export const AgreeTerms = ({ checked, onChange, testId = "agree-terms" }) => (
  <label className="mt-6 flex items-start gap-3 rounded-xl border border-border p-4 text-sm text-foreground" data-testid={testId}>
    <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5 rounded-[4px]" data-testid={`${testId}-checkbox`} aria-required="true" />
    <span>
      {t("site.agreePre")} <Link to="/terms" target="_blank" className="text-gold underline underline-offset-2">{t("site.nav.terms")}</Link>{" "}
      {t("site.and")} <Link to="/privacy" target="_blank" className="text-gold underline underline-offset-2">{t("site.nav.privacy")}</Link>
      <span className="text-rose"> *</span>
    </span>
  </label>
);
