import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { t } from "@/i18n";
import { toast } from "sonner";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const sessionId = new URLSearchParams(location.hash.slice(1)).get("session_id");
    api.post("/auth/google/session", { session_id: sessionId })
      .then(({ data }) => {
        setUser(data);
        const target = ["/", "/login"].includes(location.pathname) ? "/dashboard" : location.pathname + location.search;
        navigate(target, { replace: true, state: { user: data } });
      })
      .catch(() => {
        toast.error(t("auth.failed"));
        navigate("/login", { replace: true });
      });
  }, [location.hash, location.pathname, location.search, navigate, setUser]);

  return <div className="grid min-h-screen place-items-center text-muted-foreground" data-testid="auth-callback">{t("auth.signingIn")}</div>;
}
