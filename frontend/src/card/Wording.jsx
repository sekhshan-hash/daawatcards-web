import { useEffect } from "react";
import { loadFont } from "@/templates/registry";
import { FitText } from "./FitText";
import { SCRIPT_FONTS, eventClosing, eventDua, eventHeader, eventWording, familyText } from "@/i18n/traditions";

const SCRIPT_DIR = { arabic: "rtl" };

export const HeaderLine = ({ card, ev, testId = "card-header-line" }) => {
  const h = eventHeader(card, ev);
  useEffect(() => {
    if (h && SCRIPT_FONTS[h.script]) loadFont(`script-${h.script}`, SCRIPT_FONTS[h.script]);
  }, [h]);
  if (!h) return null;
  const style = h.custom ? ` is-custom size-${h.size || "m"} color-${h.color || "gold"}` : "";
  return (
    <div className={`gc-header-line is-${h.script}${style}`} data-testid={testId}>
      <FitText className="gc-header-text" maxLines={2} dir={SCRIPT_DIR[h.script] || "auto"} lang={h.script === "arabic" ? "ar" : undefined}>{h.text}</FitText>
      {h.sub && <p className="gc-header-sub" dir="auto">{h.sub}</p>}
    </div>
  );
};

export const FamilyBlock = ({ card }) => {
  const text = familyText(card);
  return text ? <p className="gc-family" dir="ltr" data-testid="card-family-block">{text}</p> : null;
};

export const EventWording = ({ card, ev }) => {
  const text = eventWording(card, ev);
  return text ? <p className="gc-invite gc-event-wording" dir="auto" data-testid="card-event-wording">{text}</p> : null;
};

export const EventDua = ({ card, ev }) => {
  const dua = eventDua(card, ev);
  useEffect(() => {
    if (dua) loadFont("script-arabic", SCRIPT_FONTS.arabic);
  }, [dua]);
  if (!dua) return null;
  return (
    <div className="gc-dua" data-testid="card-event-dua">
      <p className="gc-dua-text" dir="rtl" lang="ar">{dua.text}</p>
      {dua.sub && <p className="gc-header-sub" dir="ltr">{dua.sub}</p>}
    </div>
  );
};

export const ClosingLine = ({ card, ev }) => {
  const text = eventClosing(card, ev);
  return (
    <>
      {ev.rsvp_line && <p className="gc-muted gc-center" dir="auto" data-testid="card-event-rsvp-line">{ev.rsvp_line}</p>}
      {text && <p className="gc-closing" dir="auto" data-testid="card-event-closing">{text}</p>}
    </>
  );
};
