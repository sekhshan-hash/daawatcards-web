import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { makeT, dirFor } from "@/i18n";
import { getTemplate, themeVars, useTemplateFonts } from "@/templates/registry";
import { useReducedMotion } from "@/hooks/useMedia";
import { createPlayer } from "@/lib/music";
import { TitleSection, EventSwitcher, DetailsSection, CountdownSection, VenueSection, FooterSection } from "./CardSections";
import { WishesSection } from "./WishesSection";
import "@/templates/templates.css";
import "@/templates/more.css";

export const GuestCard = ({ card: fullCard, eventId, guestName = "", guestId = "", eventIds, preview = false, onSelectEvent }) => {
  const tpl = getTemplate(fullCard.template);
  const lang = fullCard.language || "en";
  const t = useMemo(() => makeT(lang), [lang]);
  const headingFont = fullCard.heading_font || "default";
  const vars = useMemo(() => themeVars(tpl, lang, headingFont), [tpl, lang, headingFont]);
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
    <div className={`gc-root ${tpl.className} ${reduced ? "is-reduced" : ""}`} style={vars} dir={dirFor(lang)} lang={lang} data-testid="guest-card">
      <div ref={scroller} className={`gc-scroller ${phase === "intro" ? "is-locked" : ""}`}>
        {card.events.length > 1 && <EventSwitcher card={card} event={event} onSelect={onSelectEvent} />}
        <TitleSection card={card} event={event} t={t} tpl={tpl} single={card.events.length === 1} />
        <DetailsSection card={card} event={event} t={t} />
        <CountdownSection card={card} event={event} t={t} />
        <VenueSection card={card} event={event} t={t} preview={preview} />
        <WishesSection card={card} event={event} guestName={guestName} guestId={guestId} t={t} preview={preview} />
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
