import { useState } from "react";
import { FitText } from "@/card/FitText";
import { Mandala } from "./RoyalArt";

const Valance = () => (
  <svg className="royal-valance" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 0 H400 V30 Q 375 58 350 30 Q 325 58 300 30 Q 275 58 250 30 Q 225 58 200 30 Q 175 58 150 30 Q 125 58 100 30 Q 75 58 50 30 Q 25 58 0 30 Z" fill="#4A0E17" />
    <path d="M0 30 Q 25 58 50 30 Q 75 58 100 30 Q 125 58 150 30 Q 175 58 200 30 Q 225 58 250 30 Q 275 58 300 30 Q 325 58 350 30 Q 375 58 400 30" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
  </svg>
);

export const RoyalIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [opening, setOpening] = useState(false);
  const open = () => {
    if (opening) return;
    setOpening(true);
    onOpen();
    setTimeout(onDone, reduced ? 350 : 1900);
  };

  return (
    <div className={`royal-intro ${opening ? "is-opening" : ""}`} data-testid="intro-screen">
      <div className="royal-curtain left" />
      <div className="royal-curtain right" />
      <Valance />
      <div className="royal-intro-center">
        <div className="royal-plaque">
          <Mandala size={84} className="royal-plaque-mandala" />
          <p className="gc-eyebrow">{t("guest.to")}</p>
          <FitText as="h2" className="royal-guest" data-testid="intro-guest-name">{guestName}</FitText>
          <button type="button" className="gc-btn royal-open" onClick={open} data-testid="intro-open-button">
            {t("guest.tapToOpen")}
          </button>
        </div>
      </div>
      {!opening && (
        <button type="button" className="intro-skip" onClick={onSkip} data-testid="intro-skip-button">{t("guest.skipIntro")}</button>
      )}
    </div>
  );
};
