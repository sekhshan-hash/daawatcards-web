import { useMemo } from "react";

export const Mandala = ({ size = 120, className = "" }) => (
  <svg viewBox="-60 -60 120 120" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="0.8">
      <circle r="56" />
      <circle r="50" strokeDasharray="2 3" />
      <circle r="22" />
      <circle r="11" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0 -22 C 9 -31, 9 -41, 0 -49 C -9 -41, -9 -31, 0 -22 Z" transform={`rotate(${i * 30})`} />
      ))}
      {Array.from({ length: 24 }).map((_, i) => (
        <circle key={`d${i}`} cx="0" cy="-53" r="1.2" fill="currentColor" transform={`rotate(${i * 15})`} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={`p${i}`} d="M0 -11 Q 5 -16 0 -21 Q -5 -16 0 -11 Z" fill="currentColor" fillOpacity=".4" transform={`rotate(${i * 45})`} />
      ))}
    </g>
  </svg>
);

const Corner = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 4 H70 M4 4 V70" />
      <path d="M10 10 H46 M10 10 V46" strokeWidth=".8" />
      <path d="M10 32 C 22 32 32 22 32 10" />
      <path d="M16 48 C 34 48 48 34 48 16" strokeWidth=".8" />
      <path d="M30 30 C 34 20 46 18 54 24 C 46 26 38 30 30 30 Z" fill="currentColor" fillOpacity=".3" />
      <path d="M30 30 C 20 34 18 46 24 54 C 26 46 30 38 30 30 Z" fill="currentColor" fillOpacity=".3" />
      <circle cx="20" cy="20" r="3.2" fill="currentColor" />
      <circle cx="70" cy="4" r="2" fill="currentColor" />
      <circle cx="4" cy="70" r="2" fill="currentColor" />
    </g>
  </svg>
);

export const RoyalFrame = () => (
  <div className="royal-frame" aria-hidden="true">
    <Mandala size={320} className="royal-bg-mandala" />
    <Corner className="rc tl" />
    <Corner className="rc tr" />
    <Corner className="rc bl" />
    <Corner className="rc br" />
  </div>
);

export const RoyalDivider = () => (
  <svg viewBox="0 0 240 24" className="gc-divider" aria-hidden="true">
    <g stroke="currentColor" fill="none" strokeWidth="1">
      <path d="M6 12 H92" />
      <path d="M148 12 H234" />
      <path d="M120 2 L130 12 L120 22 L110 12 Z" fill="currentColor" fillOpacity=".35" />
      <path d="M108 12 C 102 5 96 7 98 12 C 96 17 102 19 108 12 Z" />
      <path d="M132 12 C 138 5 144 7 142 12 C 144 17 138 19 132 12 Z" />
      <circle cx="92" cy="12" r="1.8" fill="currentColor" />
      <circle cx="148" cy="12" r="1.8" fill="currentColor" />
    </g>
  </svg>
);

export const Petals = ({ count = 18 }) => {
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 4, dur: 6 + Math.random() * 5,
      size: 10 + Math.random() * 12, tone: i % 3,
    })),
    [count],
  );
  return (
    <div className="petals" aria-hidden="true" data-testid="royal-petals">
      {items.map((p, i) => (
        <span key={i} className={`petal petal-${p.tone}`}
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, width: p.size, height: p.size * 1.3 }} />
      ))}
    </div>
  );
};
