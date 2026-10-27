import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { makeT, dirFor } from "@/i18n";
import { getTemplate, themeVars, useTemplateFonts } from "@/templates/registry";
import { colorVars, eventScheme, schemeVars } from "@/templates/eventColors";
import { useReducedMotion } from "@/hooks/useMedia";
import { createPlayer } from "@/lib/music";
import { sortEvents } from "@/lib/eventTime";
import { MultiPages, SinglePage } from "./CardPages";
import "@/templates/templates.css";
import "@/templates/more.css";
import "./pages.css";

export const GuestCard = ({ card: fullCard, eventId, guestName = "", guestId = "", eventIds, preview = false, soundOn }) => {
  const tpl = getTemplate(fullCard.template);
  const lang = fullCard.language || "en";
  const t = useMemo(() => makeT(lang), [lang]);
  const headingFont = fullCard.heading_font || "default";
  const baseVars = useMemo(() => themeVars(tpl, lang, headingFont), [tpl, lang, headingFont]);
  const card = useMemo(() => {
    const visible = fullCard.events.filter((e) => !eventIds?.length || eventIds.includes(e.event_id));
    return { ...fullCard, events: visible.length ? visible : fullCard.events };
  }, [fullCard, eventIds]);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState("intro");
  const [particles, setParticles] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const player = useRef(null);
  const scroller = useRef(null);
  const timer = useRef(null);
  useTemplateFonts(tpl, lang, headingFont);

  const events = useMemo(() => sortEvents(card.events, card.timezone), [card]);
  const multi = events.length > 1;
  const event = events.find((e) => e.event_id === eventId) || events[0];
  const startIdx = multi && eventId ? Math.max(0, events.findIndex((e) => e.event_id === eventId) + 1) : 0;
  const [pageScheme, setPageScheme] = useState(() => (startIdx ? eventScheme(fullCard, events[startIdx - 1]) : "template"));
  const [target, setTarget] = useState(null);
  const firstStart = useRef(true);
  useEffect(() => {
    if (firstStart.current) {
      firstStart.current = false;
      return;
    }
    setTarget({ i: startIdx, smooth: true });
  }, [startIdx]);
  const scheme = multi ? pageScheme : eventScheme(fullCard, event);
  const vars = useMemo(() => colorVars({ ...baseVars, ...schemeVars(tpl, scheme) }), [baseVars, tpl, scheme]);
  const name = guestName.trim() || t("guest.specialGuest");
  const hasMusic = card.music_track && card.music_track !== "none";
  const controlled = soundOn !== undefined;

  const stopMusic = () => {
    player.current?.stop();
    player.current = null;
    setMusicOn(false);
  };
  const startMusic = () => {
    stopMusic();
    if (!hasMusic || (controlled && !soundOn)) return;
    player.current = createPlayer(card.music_track);
    player.current?.start();
    setMusicOn(true);
  };

  const firstSound = useRef(true);
  useEffect(() => {
    if (firstSound.current || !controlled) {
      firstSound.current = false;
      return;
    }
    if (soundOn && phase === "card") startMusic();
    else if (!soundOn) stopMusic();
    // Only react to the external sound toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  useEffect(() => () => {
    player.current?.stop();
    clearTimeout(timer.current);
  }, []);

  const handleOpen = () => {
    startMusic();
    if (reduced) return;
    setParticles(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParticles(false), tpl.particleMs);
  };
  const handleSkip = () => {
    startMusic();
    setPhase("card");
  };
  const replay = () => {
    scroller.current?.scrollTo({ top: 0 });
    document.querySelectorAll(".gc-page").forEach((p) => p.scrollTo({ top: 0 }));
    setTarget({ i: 0, smooth: false });
    stopMusic();
    setParticles(false);
    setPhase("intro");
  };

  const Intro = tpl.Intro;
  const Particles = tpl.Particles;
  const shared = { card, t, tpl, preview, guestName, guestId, onReplay: replay };

  return (
    <div className={`gc-root ${tpl.className} ${reduced ? "is-reduced" : ""} ${multi ? "has-schemes is-paged" : ""}`} style={vars} dir={dirFor(lang)} lang={lang} data-scheme={scheme} data-testid="guest-card">
      {multi ? (
        <MultiPages {...shared} fullCard={fullCard} events={events} start={startIdx} target={target} locked={phase === "intro"} reduced={reduced} dir={dirFor(lang)} onScheme={setPageScheme} />
      ) : (
        <div ref={scroller} className={`gc-scroller ${phase === "intro" ? "is-locked" : ""}`}>
          <SinglePage {...shared} event={event} />
        </div>
      )}
      {particles && <Particles />}
      {phase === "intro" && (
        <Intro guestName={name} t={t} reduced={reduced} onOpen={handleOpen} onDone={() => setPhase("card")} onSkip={handleSkip} />
      )}
      {hasMusic && phase === "card" && !controlled && (
        <button type="button" className="gc-music" onClick={musicOn ? stopMusic : startMusic}
          aria-label={musicOn ? t("guest.musicOn") : t("guest.musicOff")} data-testid="audio-toggle-button">
          {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}
    </div>
  );
};
