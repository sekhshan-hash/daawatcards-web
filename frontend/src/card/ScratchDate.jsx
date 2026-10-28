import { useEffect, useRef, useState } from "react";
import { formatLongDate, formatTime } from "@/lib/eventTime";

const read = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

// Scratch-to-reveal the card's first event date. Hidden again on every visit.
export const ScratchDate = ({ card, event, t }) => {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const moves = useRef(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    const paint = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { width, height } = c.getBoundingClientRect();
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, read(c, "--accent") || "#D4AF37");
      g.addColorStop(1, read(c, "--accent2") || "#F5E6B8");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      for (let i = 0; i < 70; i += 1) ctx.fillRect((i * 53) % width, (i * 29) % height, 1.5, 1.5);
      ctx.fillStyle = read(c, "--bg") || "#1a1a1a";
      ctx.font = `600 15px ${read(c, "--font-title") || "serif"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t("guest.scratchHint"), width / 2, height / 2);
    };
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [t]);

  const cleared = () => {
    const c = canvas.current;
    const data = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 64) {
      total += 1;
      if (data[i] < 40) clear += 1;
    }
    return clear / total;
  };

  const scratch = (e) => {
    if (!drawing.current || revealed) return;
    const c = canvas.current;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - r.left, e.clientY - r.top, 20, 0, Math.PI * 2);
    ctx.fill();
    moves.current += 1;
    if (moves.current % 6 === 0 && cleared() > 0.45) setRevealed(true);
  };

  const down = (e) => {
    drawing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scratch(e);
  };
  const up = () => { drawing.current = false; };

  return (
    <section className="gc-section gc-center gc-scratch-section" data-testid="scratch-date-section">
      <p className="gc-eyebrow">{t("guest.saveTheDate")}</p>
      <div className={`gc-scratch ${revealed ? "is-revealed" : ""}`} data-testid="scratch-date-card">
        <div className="gc-scratch-date" aria-hidden={!revealed} data-testid="scratch-date-value">
          {[formatLongDate(event.date, card.language), formatTime(event.time, card.language)].filter(Boolean).join(" · ") || "—"}
        </div>
        <canvas ref={canvas} className="gc-scratch-cover" onPointerDown={down} onPointerMove={scratch} onPointerUp={up} onPointerCancel={up}
          role="button" tabIndex={revealed ? -1 : 0} aria-label={t("guest.tapReveal")} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRevealed(true)}
          data-testid="scratch-date-canvas" />
      </div>
      {!revealed && (
        <button type="button" className="gc-link gc-scratch-skip" onClick={() => setRevealed(true)} data-testid="scratch-date-reveal-button">{t("guest.tapReveal")}</button>
      )}
    </section>
  );
};
