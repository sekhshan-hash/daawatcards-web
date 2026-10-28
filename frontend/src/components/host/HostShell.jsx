import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useAuth } from "@/context/AuthContext";
import { t } from "@/i18n";

export const BrandMark = ({ to = "/" }) => (
  <Link to={to} className="font-display text-xl tracking-wide text-gold" data-testid="brand-logo-link">{BRAND.name}</Link>
);

export const FullLoader = () => (
  <div className="grid min-h-screen place-items-center bg-background" data-testid="page-loader"><div className="loader-ring" /></div>
);

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
};

export const HostShell = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const out = async () => {
    await logout();
    navigate("/");
  };
  return (
    <div className="host-app min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <BrandMark to="/dashboard" />
          <div className="flex items-center gap-3">
            {user?.is_admin && <Link to="/admin" className="text-sm text-gold hover:underline" data-testid="header-admin-link">{t("site.admin")}</Link>}
            {user?.picture && <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full border border-border object-cover" data-testid="header-user-picture" />}
            <span className="hidden text-sm text-muted-foreground sm:inline" data-testid="header-user-name">{user?.name || user?.email}</span>
            <button type="button" onClick={out} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm transition-colors hover:bg-secondary" data-testid="logout-button">
              <LogOut size={15} /> {t("common.logout")}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">{children}</main>
    </div>
  );
};

export const PhoneFrame = ({ children, className = "" }) => (
  <div className={`phone-frame ${className}`} data-testid="phone-frame-preview">
    <div className="phone-screen">{children}</div>
  </div>
);
