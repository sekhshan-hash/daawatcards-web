import { IntroName, IntroShell, OpenBtn, useOpen } from "./common";

export const Diya = ({ className = "", style }) => (
  <svg viewBox="0 0 60 60" className={`diya ${className}`} style={style} aria-hidden="true">
    <ellipse className="diya-glow" cx="30" cy="22" rx="16" ry="18" fill="#FFC857" opacity=".35" />
    <path className="diya-flame" d="M30 8 C 36 18 36 26 30 30 C 24 26 24 18 30 8 Z" fill="#FFB020" />
    <path d="M6 34 Q 30 30 54 34 Q 50 52 30 52 Q 10 52 6 34 Z" fill="#C0562F" />
    <path d="M10 37 Q 30 41 50 37" stroke="#E0A526" strokeWidth="2" fill="none" />
  </svg>
);

const Toran = () => (
  <svg viewBox="0 0 320 40" preserveAspectRatio="none" className="wh-toran" aria-hidden="true">
    <path d="M0 4 H320" stroke="#8A3B1E" strokeWidth="2" />
    {Array.from({ length: 11 }).map((_, i) => {
      const x = 14 + i * 29;
      return i % 2 ? <circle key={i} cx={x} cy="14" r="7" fill="#E0A526" />
        : <path key={i} d={`M${x} 4 C ${x + 8} 14 ${x + 6} 26 ${x} 34 C ${x - 6} 26 ${x - 8} 14 ${x} 4 Z`} fill="#5E7D3A" />;
    })}
  </svg>
);

export const HearthFrame = () => (
  <div className="gc-frame wh-frame" aria-hidden="true"><Toran /></div>
);

export const HearthDivider = () => (
  <div className="gc-divider wh-divider" aria-hidden="true"><span /><Diya className="lit" /><span /></div>
);

export const DiyaRow = () => (
  <div className="wh-diyas" aria-hidden="true" data-testid="hearth-diyas">
    {Array.from({ length: 7 }).map((_, i) => <Diya key={i} className="wh-diya" style={{ animationDelay: `${0.3 + i * 0.35}s` }} />)}
  </div>
);

export const DoorIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [opening, open] = useOpen(onOpen, onDone, reduced, 1700);
  return (
    <IntroShell className="wh-intro" opening={opening} onSkip={onSkip} t={t}>
      <div className="wh-doorway" onClick={open} role="presentation">
        <div className="wh-door left"><span className="wh-knob" /></div>
        <div className="wh-door right"><span className="wh-knob" /></div>
        <Toran />
      </div>
      <div className="wh-plate"><IntroName t={t} guestName={guestName} /><OpenBtn t={t} onClick={open} /></div>
    </IntroShell>
  );
};
