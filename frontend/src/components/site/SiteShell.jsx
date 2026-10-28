import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { BrandMark } from "@/components/host/HostShell";
import { useAuth } from "@/context/AuthContext";
import { BRAND } from "@/config/brand";
import { t } from "@/i18n";

export const LEGAL = [["terms", "/terms"], ["privacy", "/privacy"], ["refund", "/refund"], ["pricing", "/pricing"], ["contact", "/contact"]];

let cache = null;
const SiteContext = createContext(null);

export const useSite = () => {
  const ctx = useContext(SiteContext);
  const [site, setSite] = useState(ctx || cache);
  useEffect(() => {
    if (ctx || cache) return;
    api.get("/site").then((r) => { cache = r.data; setSite(r.data); }).catch(() => {});
  }, [ctx]);
  return ctx || site;
};
export const clearSiteCache = () => { cache = null; };

export const SiteFooter = () => (
  <footer className="border-t border-border/60 py-10 text-sm text-muted-foreground" data-testid="site-footer">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {LEGAL.map(([k, to]) => (
          <Link key={k} to={to} className="transition-colors hover:text-gold" data-testid={`footer-link-${k}`}>{t(`site.nav.${k}`)}</Link>
        ))}
      </nav>
      <p>{BRAND.name} · {t("landing.footer")}</p>
    </div>
  </footer>
);

export const PublicShell = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="host-app flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6">
        <BrandMark />
        <Link to={user ? "/dashboard" : "/login"} className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary" data-testid="public-login-link">
          {user ? t("dashboard.title") : t("site.login")}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-6">{children}</main>
      <SiteFooter />
    </div>
  );
};
