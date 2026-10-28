import { Navigate, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/host/HostShell";
import { SiteFooter } from "@/components/site/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { t } from "@/i18n";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
);

export default function Login() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const next = location.state?.from || new URLSearchParams(location.search).get("next") || "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (!loading && user) return <Navigate to={safeNext} replace />;

  return (
    <div className="host-app flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <img src="https://images.unsplash.com/photo-1621801306185-8c0ccf9c8eb8?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <p className="absolute bottom-12 left-12 max-w-sm font-display text-3xl leading-snug text-foreground">{t("landing.title")}</p>
        </div>
        <div className="flex flex-col px-6 py-8 sm:px-12">
          <BrandMark />
          <div className="my-auto w-full max-w-sm py-12 fade-up">
            <h1 className="font-display text-4xl text-foreground sm:text-5xl">{t("auth.title")}</h1>
            <p className="mt-3 text-muted-foreground">{t("auth.subtitle")}</p>
            <button type="button" onClick={() => login(safeNext)} className="mt-10 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-foreground font-semibold text-background transition-transform active:scale-[.98]" data-testid="login-google-button">
              <GoogleIcon /> {t("auth.google")}
            </button>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t("site.loginNote")}</p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
