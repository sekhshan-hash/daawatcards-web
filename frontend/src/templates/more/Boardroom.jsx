import { IntroName, IntroShell, OpenBtn, useOpen } from "./common";

export const BoardFrame = () => <div className="gc-frame br-frame" aria-hidden="true"><span className="tl" /><span className="br" /></div>;

export const BoardDivider = () => (
  <svg viewBox="0 0 120 10" className="gc-divider br-divider" aria-hidden="true">
    <path d="M10 5 H52 M68 5 H110" stroke="currentColor" strokeWidth="1" /><circle cx="60" cy="5" r="2.5" fill="currentColor" />
  </svg>
);

export const LineIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [opening, open] = useOpen(onOpen, onDone, reduced, 900);
  return (
    <IntroShell className="br-intro" opening={opening} onSkip={onSkip} t={t}>
      <IntroName t={t} guestName={guestName} />
      <span className="br-line" />
      <OpenBtn t={t} onClick={open} />
    </IntroShell>
  );
};
