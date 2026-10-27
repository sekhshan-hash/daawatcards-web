import { useState } from "react";
import { FitText } from "@/card/FitText";
import { Balloon, PARTY } from "./BirthdayArt";

const FLOATERS = [
  { left: "6%", size: 38, dur: 9, delay: 0, c: PARTY[2] },
  { left: "22%", size: 30, dur: 11, delay: 3, c: PARTY[1] },
  { left: "70%", size: 42, dur: 10, delay: 1.5, c: PARTY[3] },
  { left: "86%", size: 32, dur: 12, delay: 4.5, c: PARTY[0] },
];
const SHARDS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { x: Math.cos(a) * 110, y: Math.sin(a) * 110, r: i * 47 };
});

export const BalloonIntro = ({ guestName, t, reduced, onOpen, onDone, onSkip }) => {
  const [popped, setPopped] = useState(false);
  const pop = () => {
    if (popped) return;
    setPopped(true);
    onOpen();
    setTimeout(onDone, reduced ? 300 : 1100);
  };

  return (
    <div className={`bday-intro ${popped ? "is-opening" : ""}`} data-testid="intro-screen">
      {!reduced && FLOATERS.map((f, i) => (
        <Balloon key={i} color={f.c} size={f.size} className="bday-float"
          style={{ left: f.left, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />
      ))}
      <p className="bday-intro-eyebrow">{t("guest.surprise")}</p>
      <button type="button" className="bday-main-balloon" onClick={pop} aria-label={t("guest.tapBalloon")} data-testid="intro-balloon-button">
        <Balloon color="#FF6B6B" size={128} className="bday-main-svg" />
        {popped && !reduced && SHARDS.map((s, i) => (
          <span key={i} className="bday-shard" style={{ "--x": `${s.x}px`, "--y": `${s.y}px`, "--r": `${s.r}deg`, background: PARTY[i % 4] }} />
        ))}
      </button>
      <div className="bday-tag">
        <span>{t("guest.to")}</span>
        <FitText as="strong" data-testid="intro-guest-name">{guestName}</FitText>
      </div>
      <button type="button" className="gc-btn" onClick={pop} data-testid="intro-open-button">{t("guest.tapBalloon")}</button>
      {!popped && (
        <button type="button" className="intro-skip" onClick={onSkip} data-testid="intro-skip-button">{t("guest.skipIntro")}</button>
      )}
    </div>
  );
};
