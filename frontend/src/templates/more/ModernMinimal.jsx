import { IntroName, IntroShell, OpenBtn, useOpen } from "./common";

const Branch = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <path d="M6 114 C 30 80, 60 52, 112 8" />
      {[0.18, 0.34, 0.5, 0.66, 0.82].map((p, i) => {
        const x = 6 + p * 106;
        const y = 114 - p * 106;
        const r = i % 2 ? -50 : 40;
        return <ellipse key={i} cx={x + (i % 2 ? -8 : 8)} cy={y - 4} rx="9" ry="3.6" transform={`rotate(${r} ${x} ${y})`} />;
      })}
      <circle cx="112" cy="8" r="3" />
      <circle cx="64" cy="44" r="2" fill="currentColor" />
    </g>
  </svg>
);

export const MinimalFrame = () => (
  <div className="gc-frame mm-frame" aria-hidden="true">
    <Branch className="mm-branch tl" />
    <Branch className="mm-branch br" />
  </div>
);

export const MinimalDivider = () => (
  <svg viewBox="0 0 200 20" className="gc-divider" aria-hidden="true">
    <g stroke="currentColor" fill="none" strokeWidth="1">
      <path d="M10 10 H88 M112 10 H190" />
      <path d="M100 3 C 106 8 106 12 100 17 C 94 12 94 8 100 3 Z" />
    </g>
  </svg>
);

export const EnvelopeIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [opening, open] = useOpen(onOpen, onDone, reduced, 1900);
  return (
    <IntroShell className="mm-intro" opening={opening} onSkip={onSkip} t={t}>
      <div className="mm-env" onClick={open} role="presentation">
        <div className="mm-env-back" />
        <div className="mm-letter"><IntroName t={t} guestName={guestName} /></div>
        <div className="mm-env-front" />
        <div className="mm-flap" />
        <span className="mm-seal" />
      </div>
      <OpenBtn t={t} onClick={open} />
    </IntroShell>
  );
};
