import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/eventTime";
import { mainEvent, namesValue, occasionValue, welcomeNoteRaw } from "@/lib/textSlots";
import { TokenText } from "./TokenText";

const read = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();
const dateKey = (card) => `daawat-date-${card.slug || "preview"}`;
export const clearDateReveal = (card) => {
  try { localStorage.removeItem(dateKey(card)); } catch { /* storage blocked */ }
};
const wasRevealed = (card) => {
  try { return localStorage.getItem(dateKey(card)) === "1"; } catch { return false; }
};

// Welcome note; the first event's date sits under a small gold scratch patch, sized like the other tokens.
export const WelcomeDateNote = ({ card, t, preview, effects, reduced }) => {
  const raw = welcomeNoteRaw(card);
  const dateText = formatDate(mainEvent(card)?.date, card.language) || "—";
  const hasDate = raw.includes("{date}");
  const usePatch = hasDate && card.scratch_date !== false && !reduced && !preview;

  const canvas = useRef(null);
  const drawing = useRef(false);
  const moves = useRef(0);
  const [revealed, setRevealed] = useState(() => (usePatch ? wasRevealed(card) : true));
  const [sparkle, setSparkle] = useState(false);

  const doReveal = () => {
    setRevealed(true);
    setSparkle(true);
    try { localStorage.setItem(dateKey(card), "1"); } catch { /* storage blocked */ }
    if (effects?.vibration && !reduced && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try { navigator.vibrate([30, 60, 30]); } catch { /* unsupported */ }
    }
    setTimeout(() => setSparkle(false), 900);
  };

  useEffect(() => {
    if (!usePatch || revealed) return undefined;
    const c = canvas.current;
    if (!c) return undefined;
    const paint = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { width, height } = c.getBoundingClientRect();
      if (!width || !height) return;
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, read(c, "--accent") || "#D4AF37");
      g.addColorStop(1, read(c, "--accent2") || "#F5E6B8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,.3)";
      for (let i = 0; i < 40; i += 1) ctx.fillRect((i * 37) % width, (i * 19) % height, 1.3, 1.3);
      ctx.fillStyle = read(c, "--bg") || "#1a1a1a";
      ctx.font = `600 11px ${read(c, "--font-title") || "serif"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t("guest.scratchDate"), width / 2, height / 2);
    };
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [usePatch, revealed, t]);

  const cleared = () => {
    const c = canvas.current;
    const data = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 64) {
      total += 1;
      if (data[i] < 40) clear += 1;
    }
    return total ? clear / total : 0;
  };
  const scratch = (e) => {
    if (!drawing.current || revealed) return;
    const c = canvas.current;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - r.left, e.clientY - r.top, 16, 0, Math.PI * 2);
    ctx.fill();
    moves.current += 1;
    if (moves.current % 5 === 0 && cleared() > 0.6) doReveal();
  };
  const down = (e) => {
    drawing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scratch(e);
  };
  const up = () => { drawing.current = false; };

  if (!raw) return null;

  const dateNode = !hasDate ? null : (
    <span className={`gc-token gc-datepatch ${revealed ? "is-revealed" : ""} ${usePatch ? "" : "is-plain"}`} data-testid="welcome-date-patch">
      <span className={`gc-datepatch-value ${sparkle ? "is-sparkle" : ""}`} data-testid="welcome-date-value">{dateText}</span>
      {usePatch && !revealed && (
        <canvas ref={canvas} className="gc-datepatch-cover" onPointerDown={down} onPointerMove={scratch} onPointerUp={up} onPointerCancel={up}
          role="button" tabIndex={0} aria-label={t("guest.scratchDate")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && doReveal()} data-testid="welcome-date-canvas" />
      )}
    </span>
  );

  return (
    <>
      <TokenText as="p" className="gc-welcome-note" text={raw} occasion={occasionValue(card)} names={namesValue(card)} dateNode={dateNode} testId="welcome-note" />
      {usePatch && !revealed && (
        <button type="button" className="gc-link gc-welcome-reveal-btn" onClick={doReveal} data-testid="welcome-date-reveal-button">{t("guest.tapRevealDate")}</button>
      )}
    </>
  );
};
