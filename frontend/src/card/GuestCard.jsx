import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { makeT, dirFor } from "@/i18n";
import { getTemplate, themeVars, useTemplateFonts } from "@/templates/registry";
import { colorVars, eventScheme, schemeVars } from "@/templates/eventColors";
import { useReducedMotion } from "@/hooks/useMedia";
import { createPlayer } from "@/lib/music";
import { sortEvents } from "@/lib/eventTime";
import { SinglePage } from "./CardPages";
import { CoverPage, EventPage } from "./Hub";
import { mainPhoto } from "./CardPhoto";
import { Fireworks } from "./Fireworks";
import { WelcomeScreen } from "./WelcomeScreen";
import { clearDateReveal } from "./WelcomeDateNote";
import { Watermark } from "./Watermark";
import { useVibration } from "./useVibration";
import { IntroPhotoContext, IntroTitleContext } from "@/templates/more/common";
import { introTitle } from "@/i18n/traditions";
import "@/templates/templates.css";
import "@/templates/more.css";
import "./pages.css";
import "./hub.css";

export const cardEffects = (card) => ({ fireworks: true, vibration: true, intensity: "medium", ...(card.effects || {}) });

const fxKey = (card) => `daawat-fx-${card.slug || "preview"}`;
const readFx = (card) => {
  try {
    return localStorage.getItem(fxKey(card)) !== "off";
  } catch {
    return true;
  }
};

// eventId = the open event page (null = cover). With onNavigate the parent owns it (real URLs); otherwise it is local (previews).
export const GuestCard = ({ card: fullCard, eventId = null, onNavigate, focus, guestName = "", guestId = "", eventIds, preview = false, soundOn, watermark }) => {
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
  const [fxOn, setFxOn] = useState(() => readFx(fullCard));
  const [localView, setLocalView] = useState(eventId);
  const [wishesReq, setWishesReq] = useState(0);
  const player = useRef(null);
  const scroller = useRef(null);
  const root = useRef(null);
  const timer = useRef(null);
  const coverScroll = useRef(0);
  const wantWishes = useRef(false);
  const prevIdx = useRef(0);
  useTemplateFonts(tpl, lang, headingFont);

  useEffect(() => setLocalView(eventId), [eventId]);
  const events = useMemo(() => sortEvents(card.events, card.timezone), [card]);
  const multi = events.length > 1;
  const view = onNavigate ? eventId : localView;
  const current = multi ? events.find((e) => e.event_id === view) || null : events[0];
  const pageKey = multi ? current?.event_id || "cover" : "single";
  const idx = current ? events.indexOf(current) + 1 : 0;
  const direction = idx >= prevIdx.current ? "is-fwd" : "is-back";
  useEffect(() => {
    prevIdx.current = idx;
  }, [idx]);

  const scheme = multi ? (current ? eventScheme(fullCard, current) : "template") : eventScheme(fullCard, events[0]);
  const vars = useMemo(() => colorVars({ ...baseVars, ...schemeVars(tpl, scheme) }), [baseVars, tpl, scheme]);
  const name = guestName.trim() || t("guest.specialGuest");
  const hasMusic = card.music_track && card.music_track !== "none";
  const controlled = soundOn !== undefined;
  const effects = cardEffects(fullCard);
  const showFx = effects.fireworks && fxOn && phase === "card";
  const vibrate = useVibration(root, !preview && effects.fireworks && effects.vibration && fxOn && !reduced);
  const photo = mainPhoto(card);

  const go = useCallback((id) => {
    if (pageKey === "cover") coverScroll.current = scroller.current?.scrollTop || 0;
    if (onNavigate) onNavigate(id);
    else setLocalView(id);
  }, [onNavigate, pageKey]);
  const goWishes = useCallback(() => {
    wantWishes.current = true;
    setWishesReq((n) => n + 1);
    go(null);
  }, [go]);

  useLayoutEffect(() => {
    if (pageKey === "cover" && !wantWishes.current && scroller.current) scroller.current.scrollTop = coverScroll.current;
  }, [pageKey]);
  useEffect(() => {
    if (!wantWishes.current || (multi && pageKey !== "cover")) return;
    wantWishes.current = false;
    requestAnimationFrame(() => scroller.current?.querySelector("#gc-wishes")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }));
  }, [wishesReq, pageKey, multi, reduced]);

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
    vibrate.open();
    startMusic();
    if (reduced) return;
    setParticles(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParticles(false), tpl.particleMs);
  };
  const handleSkip = () => {
    vibrate.open();
    startMusic();
    setPhase("welcome");
  };
  const replay = () => {
    coverScroll.current = 0;
    scroller.current?.scrollTo({ top: 0 });
    stopMusic();
    setParticles(false);
    clearDateReveal(fullCard);
    setPhase("intro");
  };
  const toggleFx = () => {
    const on = !fxOn;
    setFxOn(on);
    try {
      localStorage.setItem(fxKey(fullCard), on ? "on" : "off");
    } catch {
      /* storage blocked */
    }
  };

  // Wizard photo placement: jump the preview to the chosen page.
  useEffect(() => {
    if (!focus?.n) return;
    if (focus.place === "intro") {
      replay();
      return;
    }
    if (focus.place === "welcome") {
      coverScroll.current = 0;
      scroller.current?.scrollTo({ top: 0 });
      setPhase("welcome");
      return;
    }
    setPhase("card");
    if (focus.place === "wishes") goWishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n]);

  const Intro = tpl.Intro;
  const Particles = tpl.Particles;
  const shared = { card, t, tpl, preview, guestName, guestId, onReplay: replay };
  const page = !multi ? <SinglePage {...shared} event={events[0]} />
    : current ? <EventPage card={card} ev={current} events={events} t={t} preview={preview} onOpen={go} onWishes={goWishes} />
      : <CoverPage {...shared} fullCard={fullCard} events={events} onOpen={go} />;

  return (
    <div ref={root} className={`gc-root ${tpl.className} ${reduced ? "is-reduced" : ""} ${multi ? "has-schemes is-hub" : ""} ${showFx ? "has-fx" : ""}`} style={vars}
      dir={dirFor(lang)} lang={lang} data-scheme={scheme} data-page={pageKey} data-testid="guest-card">
      <div ref={scroller} key={pageKey} className={`gc-scroller gc-view ${direction} ${phase !== "card" ? "is-locked" : ""}`} data-testid="card-view">
        <div className="gc-view-inner">{page}</div>
      </div>
      {showFx && (reduced ? <div className="gc-fx gc-fx-static" aria-hidden="true" data-testid="fireworks-static" />
        : <Fireworks intensity={effects.intensity} rootRef={root} onBigBurst={vibrate.pulse} />)}
      {showFx && <div className="gc-fx-scrim" aria-hidden="true" />}
      {particles && <Particles />}
      {phase === "intro" && (
        <IntroTitleContext.Provider value={introTitle(fullCard)}>
          <IntroPhotoContext.Provider value={photo?.place === "intro" ? photo : null}>
            <Intro guestName={name} t={t} reduced={reduced} onOpen={handleOpen} onDone={() => setPhase("welcome")} onSkip={handleSkip} />
          </IntroPhotoContext.Provider>
        </IntroTitleContext.Provider>
      )}
      {phase !== "card" && <WelcomeScreen card={card} t={t} tpl={tpl} preview={preview} effects={effects} reduced={reduced} onContinue={() => setPhase("card")} />}
      {(watermark ?? fullCard.watermark) && <Watermark />}
      {phase === "card" && !controlled && (
        <div className="gc-corner-btns">
          {effects.fireworks && (
            <button type="button" className={`gc-music gc-fx-btn ${fxOn ? "" : "is-off"}`} onClick={toggleFx} aria-pressed={fxOn}
              aria-label={fxOn ? t("guest.effectsOn") : t("guest.effectsOff")} data-testid="effects-toggle-button">
              <Sparkles size={18} />
            </button>
          )}
          {hasMusic && (
            <button type="button" className="gc-music" onClick={musicOn ? stopMusic : startMusic}
              aria-label={musicOn ? t("guest.musicOn") : t("guest.musicOff")} data-testid="audio-toggle-button">
              {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
