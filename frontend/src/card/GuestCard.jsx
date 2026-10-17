import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { makeT, dirFor } from "@/i18n";
import { getTemplate, useTemplateFonts } from "@/templates/registry";
import { useReducedMotion } from "@/hooks/useMedia";
import { createPlayer } from "@/lib/music";
import { TitleSection, EventSwitcher, DetailsSection, CountdownSection, VenueSection, FooterSection } from "./CardSections";
import { RsvpSection } from "./RsvpSection";
import "@/templates/templates.css";

export const GuestCard = ({ card, eventId, guestName = "", preview = false, onSelectEvent }) => {
  const tpl = getTemplate(card.template);
  const t = useMemo(() => makeT(card.language), [card.language]);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState("intro");
  const [particles, setParticles] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const player = useRef(null);
  const scroller = useRef(null);
  const timer = useRef(null);
  useTemplateFonts(tpl);

  const event = card.events.find((e) => e.event_id === eventId) || card.events[0];
  const name = guestName.trim() || t("guest.specialGuest");
  const hasMusic = card.music_track && card.music_track !== "none";

  const stopMusic = () => {
    player.current?.stop();
    player.current = null;
    setMusicOn(false);
  };
  const startMusic = () => {
    stopMusic();
    if (!hasMusic) return;
    player.current = createPlayer(card.music_track);
    player.current?.start();
    setMusicOn(true);
  };

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
    stopMusic();
    setParticles(false);
    setPhase("intro");
  };

  const Intro = tpl.Intro;
  const Particles = tpl.Particles;

  return (
    <div className={`gc-root ${tpl.className} ${reduced ? "is-reduced" : ""}`} style={tpl.vars} dir={dirFor(card.language)} data-testid="guest-card">
      <div ref={scroller} className={`gc-scroller ${phase === "intro" ? "is-locked" : ""}`}>
        {card.events.length > 1 && <EventSwitcher card={card} event={event} onSelect={onSelectEvent} />}
        <TitleSection card={card} event={event} t={t} tpl={tpl} single={card.events.length === 1} />
        <DetailsSection card={card} event={event} t={t} />
        <CountdownSection card={card} event={event} t={t} />
        <VenueSection card={card} event={event} t={t} preview={preview} />
        <RsvpSection card={card} event={event} guestName={guestName} t={t} preview={preview} />
        <FooterSection card={card} t={t} tpl={tpl} onReplay={replay} />
      </div>
      {particles && <Particles />}
      {phase === "intro" && (
        <Intro guestName={name} t={t} reduced={reduced} onOpen={handleOpen} onDone={() => setPhase("card")} onSkip={handleSkip} />
      )}
      {hasMusic && phase === "card" && (
        <button type="button" className="gc-music" onClick={musicOn ? stopMusic : startMusic}
          aria-label={musicOn ? t("guest.musicOn") : t("guest.musicOff")} data-testid="audio-toggle-button">
          {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}
    </div>
  );
};
