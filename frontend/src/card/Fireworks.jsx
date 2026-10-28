import { useEffect, useRef } from "react";

const BUDGET = { low: 60, medium: 90, high: 120 };
const PER_BURST = { low: 22, medium: 32, high: 40 };

const colorsOf = (el) => {
  const cs = getComputedStyle(el);
  return [cs.getPropertyValue("--accent"), cs.getPropertyValue("--accent2"), "#FFF6E0"].map((c) => c.trim()).filter(Boolean);
};

// Soft canvas fireworks: max 3 bursts on screen, a burst every 1.5-3 s, fewer particles when fps drops below 40.
export const Fireworks = ({ intensity = "medium", rootRef, onBigBurst }) => {
  const ref = useRef(null);
  const onBig = useRef(onBigBurst);
  onBig.current = onBigBurst;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let parts = [];
    let scale = 1;
    let raf = 0;
    let last = performance.now();
    let next = last + 700;
    let frames = 0;
    let acc = 0;
    let id = 0;

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const burst = () => {
      if (new Set(parts.map((p) => p.b)).size >= 3) return;
      const n = Math.min(Math.round(PER_BURST[intensity] * scale * (0.7 + Math.random() * 0.5)), Math.round(BUDGET[intensity] * scale) - parts.length);
      if (n < 6) return;
      const colors = colorsOf(rootRef.current || canvas);
      const x = w * (0.15 + Math.random() * 0.7);
      const y = h * (0.12 + Math.random() * 0.4);
      const speed = 70 + Math.random() * 50;
      id += 1;
      for (let i = 0; i < n; i += 1) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
        const v = speed * (0.55 + Math.random() * 0.45);
        parts.push({ b: id, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, ttl: 1.3 + Math.random() * 0.7,
          c: colors[i % colors.length], s: 1.6 + Math.random() * 1.6 });
      }
      if (n >= PER_BURST[intensity] * scale * 0.95) onBig.current?.();
    };

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      frames += 1;
      if (acc >= 1) {
        if (frames / acc < 40 && scale > 0.35) scale *= 0.7;
        frames = 0;
        acc = 0;
      }
      if (now >= next) {
        burst();
        next = now + 1500 + Math.random() * 1500;
      }
      ctx.clearRect(0, 0, w, h);
      parts = parts.filter((p) => (p.life += dt) < p.ttl);
      parts.forEach((p) => {
        p.vx *= 0.975;
        p.vy = p.vy * 0.975 + 42 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = 0.7 * (1 - p.life / p.ttl);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      });
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      next = last + 600;
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intensity, rootRef]);

  return <canvas ref={ref} className="gc-fx" aria-hidden="true" data-testid="fireworks-canvas" />;
};
