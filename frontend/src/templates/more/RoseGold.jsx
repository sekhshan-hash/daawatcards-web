import { useRef } from "react";
import { ChevronUp } from "lucide-react";
import { IntroName, IntroShell, OpenBtn, Scatter, Sparkle, useOpen } from "./common";

const Ring = ({ className, gem }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="rg-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F4C7B8" /><stop offset=".5" stopColor="#B76E79" /><stop offset="1" stopColor="#E8A99A" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="56" r="32" fill="none" stroke="url(#rg-metal)" strokeWidth="7" />
    {gem && <path d="M50 8 L60 20 L50 30 L40 20 Z" fill="#FFF" stroke="#E8A99A" strokeWidth="1.5" />}
  </svg>
);

export const RoseFrame = () => (
  <div className="gc-frame rg-frame" aria-hidden="true">
    <Sparkle className="rg-spark s1" size={16} /><Sparkle className="rg-spark s2" size={11} />
    <Sparkle className="rg-spark s3" size={14} /><Sparkle className="rg-spark s4" size={10} />
  </div>
);

export const RoseDivider = () => (
  <svg viewBox="0 0 200 22" className="gc-divider" aria-hidden="true">
    <g stroke="currentColor" fill="none" strokeWidth="1">
      <path d="M8 11 H84 M116 11 H192" />
      <circle cx="94" cy="11" r="6" /><circle cx="106" cy="11" r="6" />
    </g>
  </svg>
);

export const Sparkles = () => (
  <Scatter count={22} className="rg-sparkles" testId="rose-sparkles" render={(s) => (
    <Sparkle key={s.i} size={s.size} color={s.i % 3 ? "#E8A99A" : "#FFFFFF"} className="rg-twinkle"
      style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
  )} />
);

export const RingsIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [opening, open] = useOpen(onOpen, onDone, reduced, 1100);
  const startY = useRef(null);
  const down = (e) => { startY.current = e.clientY ?? e.touches?.[0]?.clientY; };
  const up = (e) => {
    const y = e.clientY ?? e.changedTouches?.[0]?.clientY;
    if (startY.current != null && y != null && startY.current - y > 40) open();
    startY.current = null;
  };
  return (
    <IntroShell className="rg-intro" opening={opening} onSkip={onSkip} t={t} onPointerDown={down} onPointerUp={up}>
      <div className="rg-rings">
        <Ring className="rg-ring left" />
        <Ring className="rg-ring right" gem />
        <Sparkle className="rg-ring-spark" size={22} color="#FFF" />
      </div>
      <IntroName t={t} guestName={guestName} />
      <p className="rg-swipe" data-testid="intro-swipe-hint"><ChevronUp size={18} /> {t("guest.swipeUp")}</p>
      <OpenBtn t={t} onClick={open} />
    </IntroShell>
  );
};
