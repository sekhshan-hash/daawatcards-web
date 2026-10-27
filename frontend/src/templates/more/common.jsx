import { useMemo, useState } from "react";
import { FitText } from "@/card/FitText";

export const useOpen = (onOpen, onDone, reduced, ms) => {
  const [opening, setOpening] = useState(false);
  const open = () => {
    if (opening) return;
    setOpening(true);
    onOpen();
    setTimeout(onDone, reduced ? 300 : ms);
  };
  return [opening, open];
};

export const IntroShell = ({ className, opening, onSkip, t, children, ...rest }) => (
  <div className={`${className} ${opening ? "is-opening" : ""}`} data-testid="intro-screen" {...rest}>
    {children}
    {!opening && <button type="button" className="intro-skip" onClick={onSkip} data-testid="intro-skip-button">{t("guest.skipIntro")}</button>}
  </div>
);

export const IntroName = ({ t, guestName }) => (
  <>
    <p className="gc-eyebrow">{t("guest.to")}</p>
    <FitText as="h2" className="intro-name" data-testid="intro-guest-name">{guestName}</FitText>
  </>
);

export const OpenBtn = ({ t, onClick, label }) => (
  <button type="button" className="gc-btn" onClick={onClick} data-testid="intro-open-button">{label || t("guest.tapToOpen")}</button>
);

export const SoftFade = () => <div className="soft-fade" aria-hidden="true" data-testid="soft-fade" />;

export const Scatter = ({ count, className, render, testId }) => {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, left: Math.random() * 100, top: Math.random() * 100, size: 8 + Math.random() * 14, delay: Math.random() * 2,
  })), [count]);
  return <div className={className} aria-hidden="true" data-testid={testId}>{items.map(render)}</div>;
};

export const Sparkle = ({ size = 14, color = "currentColor", style, className = "" }) => (
  <svg viewBox="0 0 20 20" width={size} height={size} style={style} className={className} aria-hidden="true">
    <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill={color} />
  </svg>
);
