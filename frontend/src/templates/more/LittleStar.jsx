import { IntroName, IntroShell, OpenBtn, Scatter, Sparkle, useOpen } from "./common";

const Moon = () => (
  <svg viewBox="0 0 120 120" className="ls-moon" aria-hidden="true">
    <path d="M78 14 A 48 48 0 1 0 104 86 A 40 40 0 1 1 78 14 Z" fill="#FFF3C4" />
    <path d="M44 62 Q 50 68 56 62" stroke="#B8A15A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M46 78 Q 54 84 62 78" stroke="#E79AAE" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="40" cy="72" r="4" fill="#F7B9C8" opacity=".7" />
    <text x="86" y="40" fontSize="14" fill="#8C7AE6" fontFamily="sans-serif">z</text>
    <text x="96" y="26" fontSize="10" fill="#8C7AE6" fontFamily="sans-serif">z</text>
  </svg>
);

const Cloud = ({ className }) => <span className={`ls-cloud ${className}`} aria-hidden="true" />;

export const StarFrame = () => (
  <div className="gc-frame ls-frame" aria-hidden="true">
    <Cloud className="f1" /><Cloud className="f2" />
    <Sparkle className="ls-fstar a" size={12} /><Sparkle className="ls-fstar b" size={9} /><Sparkle className="ls-fstar c" size={14} />
  </div>
);

export const StarDivider = () => (
  <svg viewBox="0 0 200 22" className="gc-divider" aria-hidden="true">
    <path d="M10 11 H84 M116 11 H190" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 5" strokeLinecap="round" />
    <path d="M100 2 L103 9 L110 11 L103 13 L100 20 L97 13 L90 11 L97 9 Z" fill="currentColor" />
  </svg>
);

export const TwinkleStars = () => (
  <Scatter count={26} className="ls-stars" testId="little-stars" render={(s) => (
    <Sparkle key={s.i} size={s.size} color={["#FFE08A", "#FFFFFF", "#C9B8FF"][s.i % 3]} className="ls-star"
      style={{ left: `${s.left}%`, top: `${s.top * 0.7}%`, animationDelay: `${s.i * 0.12}s` }} />
  )} />
);

export const CloudIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [opening, open] = useOpen(onOpen, onDone, reduced, 1500);
  return (
    <IntroShell className="ls-intro" opening={opening} onSkip={onSkip} t={t}>
      <div className="ls-sky" onClick={open} role="presentation">
        <Moon />
        <Cloud className="c-left" />
        <Cloud className="c-right" />
      </div>
      <IntroName t={t} guestName={guestName} />
      <OpenBtn t={t} onClick={open} />
    </IntroShell>
  );
};
