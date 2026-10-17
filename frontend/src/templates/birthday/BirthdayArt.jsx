import { useMemo } from "react";

export const PARTY = ["#FF6B6B", "#FFD166", "#4ECDC4", "#9D4EDD"];

export const Balloon = ({ color = "#FF6B6B", size = 80, className = "", style }) => (
  <svg viewBox="0 0 60 100" width={size} height={(size * 100) / 60} className={className} style={style} aria-hidden="true">
    <path d="M30 2 C 12 2 2 18 2 32 C 2 50 18 64 28 68 L 26 72 L 34 72 L 32 68 C 42 64 58 50 58 32 C 58 18 48 2 30 2 Z" fill={color} />
    <ellipse cx="19" cy="21" rx="5" ry="10" fill="#fff" opacity=".35" transform="rotate(-20 19 21)" />
    <path d="M30 72 C 24 80 36 86 28 99" stroke="rgba(255,255,255,.6)" strokeWidth="1.2" fill="none" />
  </svg>
);

const Bunting = () => (
  <svg viewBox="0 0 320 44" className="bday-bunting" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 6 Q160 30 320 6" stroke="rgba(255,255,255,.5)" strokeWidth="1.2" fill="none" />
    {Array.from({ length: 9 }).map((_, i) => {
      const x = 8 + i * 35;
      const y = 6 + 12 * (1 - ((x + 11 - 160) / 160) ** 2);
      return <path key={i} d={`M${x} ${y} L${x + 22} ${y} L${x + 11} ${y + 20} Z`} fill={PARTY[i % 4]} />;
    })}
  </svg>
);

export const BirthdayFrame = () => (
  <div className="bday-frame" aria-hidden="true">
    <Bunting />
    <Balloon color="#9D4EDD" size={44} className="bday-side left" />
    <Balloon color="#4ECDC4" size={52} className="bday-side right" />
  </div>
);

export const BirthdayDivider = () => (
  <svg viewBox="0 0 160 20" className="gc-divider" aria-hidden="true">
    <path d="M4 10 Q 14 0 24 10 T 44 10 T 64 10" stroke="#4ECDC4" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="80" cy="10" r="6" fill="#FFD166" />
    <path d="M96 10 Q 106 20 116 10 T 136 10 T 156 10" stroke="#FF6B6B" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

export const renderPlayfulName = (name) =>
  Array.from(name).map((ch, i) => (
    <span key={i} className="bday-letter" style={{ color: PARTY[i % 4], "--tilt": `${i % 2 ? 4 : -4}deg`, animationDelay: `${i * 0.08}s` }}>
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));

export const Confetti = ({ count = 70 }) => {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 170;
      const w = 6 + Math.random() * 6;
      return {
        x: Math.cos(ang) * dist, up: -(80 + Math.random() * 180), y: 260 + Math.random() * 360,
        r: Math.random() * 720 - 360, d: Math.random() * 0.25, c: PARTY[i % 4], w, round: i % 5 === 0,
      };
    }),
    [count],
  );
  return (
    <div className="confetti" aria-hidden="true" data-testid="birthday-confetti">
      {pieces.map((p, i) => (
        <i key={i} style={{
          "--x": `${p.x}px`, "--up": `${p.up}px`, "--y": `${p.y}px`, "--r": `${p.r}deg`, "--d": `${p.d}s`,
          background: p.c, width: p.w, height: p.round ? p.w : p.w * 1.6, borderRadius: p.round ? "50%" : "2px",
        }} />
      ))}
    </div>
  );
};
