import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BrandMark } from "@/components/host/HostShell";
import { t } from "@/i18n";

const googleLogin = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const redirectUrl = window.location.origin + "/dashboard";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

const PhoneForm = ({ onSent }) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/otp/request", { phone });
      onSent({ ...data, name });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={send} className="space-y-3">
      <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="phone">{t("auth.phone")}</label>
      <div className="flex gap-2">
        <span className="grid h-12 place-items-center rounded-xl border border-border px-3 text-sm text-muted-foreground">+91</span>
        <Input id="phone" type="tel" inputMode="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl text-base" data-testid="login-phone-input" required />
      </div>
      <Input placeholder={`${t("auth.name")} (${t("common.optional")})`} value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl text-base" data-testid="login-name-input" />
      <button type="submit" disabled={busy} className="btn-gold w-full" data-testid="login-send-code-button">
        <MessageCircle size={17} /> {t("auth.sendCode")}
      </button>
    </form>
  );
};

const CodeForm = ({ sent, onBack, onVerified }) => {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy(true);
    try {
      const { data } = await api.post("/auth/otp/verify", { phone: sent.phone, code: value, name: sent.name });
      onVerified(data);
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" data-testid="login-code-sent-text">{t("auth.codeSent", { phone: sent.phone })}</p>
      {sent.mocked && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold" data-testid="login-mock-code-notice">
          {t("auth.mockNotice", { code: sent.dev_code })}
        </p>
      )}
      <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) verify(v); }} data-testid="login-otp-input">
        <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />)}</InputOTPGroup>
      </InputOTP>
      <button type="button" disabled={busy || code.length !== 6} onClick={() => verify()} className="btn-gold w-full" data-testid="login-verify-button">{t("auth.verify")}</button>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="login-change-number-button">
        <ArrowLeft size={14} /> {t("auth.changeNumber")}
      </button>
    </div>
  );
};

export default function Login() {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState(null);
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const verified = (u) => {
    setUser(u);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="host-app grid min-h-screen lg:grid-cols-2">
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
          <button type="button" onClick={googleLogin} className="mt-10 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-foreground font-semibold text-background transition-transform active:scale-[.98]" data-testid="login-google-button">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            {t("auth.google")}
          </button>
          <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("auth.or")}<span className="h-px flex-1 bg-border" /></div>
          {sent ? <CodeForm sent={sent} onBack={() => setSent(null)} onVerified={verified} /> : <PhoneForm onSent={setSent} />}
        </div>
      </div>
    </div>
  );
}
