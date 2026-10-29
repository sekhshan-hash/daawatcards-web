import { useCallback, useEffect, useRef, useState } from "react";
import { HEADING_FONTS, loadFont } from "@/templates/registry";
import { Baby, Briefcase, Cake, Check, Gem, Gift, Heart, Home, Music, Pause, Play, PlayCircle, RotateCcw } from "lucide-react";
import { TemplatePreview } from "./TemplatePreview";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TEMPLATE_LIST } from "@/templates/registry";
import { createPlayer, MUSIC_TRACKS } from "@/lib/music";
import { t, makeT, LANGUAGES, blessingText } from "@/i18n";
import { TRADITIONS, autoIntroTitle, cardHeader, familyText, headerOptions } from "@/i18n/traditions";
import { HeaderBoxes } from "./HeaderBoxes";
import { SlotWarning, TextSummary } from "./TextSummary";
import { invitationParagraph, occasionName } from "@/lib/textSlots";

const TYPES = [
  ["wedding", Heart, true], ["engagement", Gem, true], ["birthday", Cake, true], ["aqiqah", Baby, true],
  ["babyShower", Gift, true], ["housewarming", Home, true], ["corporate", Briefcase, true],
];

export const StepTitle = ({ children, hint }) => (
  <div className="mb-8">
    <h2 className="font-display text-2xl text-foreground sm:text-3xl" data-testid="wizard-step-title">{children}</h2>
    {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
  </div>
);

export const StepEventType = ({ card, onType, onTradition }) => (
  <>
    <StepTitle>{t("wizard.typeTitle")}</StepTitle>
    <div className="grid gap-3 sm:grid-cols-2">
      {TYPES.map(([key, Icon, enabled]) => (
        <button key={key} type="button" disabled={!enabled} onClick={() => onType(key)} data-testid={`wizard-event-type-${key}`}
          className={`choice-tile ${card.event_type === key ? "is-active" : ""}`}>
          <Icon size={22} className="text-gold" />
          <span className="flex-1 text-left">
            <span className="block font-semibold text-foreground">{t(`eventTypes.${key}`)}</span>
            <span className="block text-xs text-muted-foreground">{enabled ? t(`eventTypeHints.${key}`) : t("common.comingSoon")}</span>
          </span>
          {card.event_type === key && <Check size={18} className="text-gold" />}
        </button>
      ))}
    </div>
    <div className="mt-8">
      <Field label={t("wizard.tradition")} hint={t("wizard.traditionHint")}>
        <div className="flex flex-wrap gap-2" data-testid="wizard-tradition-picker">
          {TRADITIONS.map((k) => (
            <button key={k} type="button" onClick={() => onTradition(k)} data-testid={`wizard-tradition-${k}`}
              className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${(card.tradition || "neutral") === k ? "border-gold bg-gold text-background" : "border-border hover:border-gold/50"}`}>
              {t(`wizard.traditions.${k}`)}
            </button>
          ))}
        </div>
      </Field>
    </div>
  </>
);

const HeaderPicker = ({ card, update }) => {
  const tradition = card.tradition || "neutral";
  const fallback = headerOptions(card)[0];
  const setEvent = (i, patch) => update({ events: card.events.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  return (
    <Field label={t("wizard.headerLine")} hint={t("wizard.headerLineHint")}>
      <div className="space-y-4" data-testid="wizard-header-picker">
        <HeaderBoxes tradition={tradition} fallback={fallback} keyValue={card.header_key} custom={card.custom_header}
          onKey={(k) => update({ header_key: k })} onCustom={(c) => update({ custom_header: c })} testId="wizard-header" />
        {card.events.length > 1 && (
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
            {t("wizard.headerPerEvent")}
            <Switch checked={!!card.header_per_event} onCheckedChange={(v) => update({ header_per_event: v })} data-testid="wizard-header-per-event-switch" />
          </label>
        )}
        {card.header_per_event && card.events.length > 1 && card.events.map((ev, i) => (
          <div key={ev.event_id} className="space-y-2 rounded-2xl border border-gold/30 p-3" data-testid={`wizard-event-${i}-header`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{ev.name || `#${i + 1}`}</p>
            <HeaderBoxes tradition={tradition} fallback={cardHeader(card) || fallback} keyValue={ev.header_key} custom={ev.custom_header}
              onKey={(k) => setEvent(i, { header_key: k })} onCustom={(c) => setEvent(i, { custom_header: c })} testId={`wizard-event-${i}-header`} />
          </div>
        ))}
      </div>
    </Field>
  );
};

const IntroTitleField = ({ card, update }) => {
  const auto = autoIntroTitle(card);
  return (
    <Field label={t("wizard.introTitle")} hint={t("wizard.introTitleHint")}>
      <div className="flex gap-2">
        <Input className="h-12 rounded-xl text-base" maxLength={80} value={card.intro_title || auto} dir="auto"
          onChange={(e) => update({ intro_title: e.target.value === auto ? "" : e.target.value })} data-testid="wizard-intro-title-input" />
        {card.intro_title && (
          <button type="button" onClick={() => update({ intro_title: "" })} className="btn-outline shrink-0" data-testid="wizard-intro-title-reset"><RotateCcw size={15} /></button>
        )}
      </div>
    </Field>
  );
};

const FamilyFields = ({ card, update }) => {
  const f = card.family || {};
  const set = (patch) => update({ family: { ...f, ...patch } });
  const keys = ["groom_family", "bride_family", "groom_parents", "bride_parents", "groom_grandparents", "bride_grandparents"];
  const preview = familyText({ ...card, family: { ...f, hidden: false } });
  return (
    <Field label={t("wizard.family")} hint={t("wizard.familyHint")}>
      <div className="space-y-4 rounded-2xl border border-border p-4" data-testid="wizard-family-block">
        <div className="grid gap-3 sm:grid-cols-2">
          {keys.map((k) => (
            <div key={k}>
              <p className="mb-1 text-xs text-muted-foreground">{t(`wizard.familyFields.${k}`)}</p>
              <Input className="h-11 rounded-xl" value={f[k] || ""} maxLength={k.endsWith("grandparents") ? 160 : 120} onChange={(e) => set({ [k]: e.target.value })}
                placeholder={k.endsWith("parents") && !k.includes("grand") ? t("wizard.parentsPlaceholder") : ""} data-testid={`wizard-family-${k.replace(/_/g, "-")}-input`} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("wizard.hostingSide")}:</span>
          {["groom", "bride"].map((s) => (
            <button key={s} type="button" onClick={() => set({ host_side: s })} data-testid={`wizard-family-host-${s}`}
              className={`rounded-full border px-4 py-1.5 text-xs ${(f.host_side || "groom") === s ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"}`}>
              {t(s === "groom" ? "wizard.hostGroom" : "wizard.hostBride")}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          {t("wizard.hideFamily")}
          <Switch checked={!!f.hidden} onCheckedChange={(v) => set({ hidden: v })} data-testid="wizard-family-hide-switch" />
        </label>
        {preview && !f.hidden && <p className="rounded-xl bg-secondary/60 px-4 py-3 text-sm italic text-foreground" data-testid="wizard-family-preview">{preview}</p>}
      </div>
    </Field>
  );
};

export const StepTemplate = ({ card, onTemplate, update }) => {
  const [previewId, setPreviewId] = useState(null);
  useEffect(() => TEMPLATE_LIST.forEach((tp) => loadFont(tp.id, tp.fontsHref)), []);
  const list = [...TEMPLATE_LIST].sort((a, b) => b.eventTypes.includes(card.event_type) - a.eventTypes.includes(card.event_type));
  const closePreview = useCallback(() => setPreviewId(null), []);
  return (
    <>
      <StepTitle>{t("wizard.templateTitle")}</StepTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((tpl) => (
          <div key={tpl.id} className="relative">
            <button type="button" onClick={() => onTemplate(tpl.id)} data-testid={`wizard-template-${tpl.id}`}
              className={`w-full overflow-hidden rounded-2xl border text-left transition-colors ${card.template === tpl.id ? "border-gold ring-2 ring-gold/30" : "border-border hover:border-gold/40"}`}>
              <div className="relative grid h-36 place-items-center" style={{ background: `radial-gradient(circle at 50% 30%, ${tpl.swatch[1]}, ${tpl.swatch[0]} 75%)` }}>
                <span style={{ fontFamily: tpl.fonts.display.join(", "), color: tpl.swatch[2] }} className="text-4xl">{tpl.sample}</span>
                {tpl.eventTypes.includes(card.event_type) && <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white">{t("wizard.recommended")}</span>}
              </div>
              <div className="p-4">
                <p className="font-semibold text-foreground">{t(`templates.${tpl.id}.name`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`templates.${tpl.id}.desc`)}</p>
              </div>
            </button>
            <button type="button" onClick={() => setPreviewId(tpl.id)} data-testid={`wizard-template-watch-${tpl.id}`}
              className="absolute right-3 top-[6.5rem] inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/75">
              <PlayCircle size={14} /> {t("wizard.watchIntro")}
            </button>
          </div>
        ))}
      </div>
      {previewId && <TemplatePreview tplId={previewId} card={card} onClose={closePreview} onUse={(id) => { onTemplate(id); setPreviewId(null); }} />}
      <EffectsField card={card} update={update} />
    </>
  );
};

const EffectsField = ({ card, update }) => {
  const fx = { fireworks: true, vibration: true, intensity: "medium", ...(card.effects || {}) };
  const set = (patch) => update({ effects: { ...fx, ...patch } });
  return (
    <div className="mt-10">
      <Field label={t("wizard.effects")} hint={t("wizard.effectsHint")}>
        <div className="space-y-3 rounded-2xl border border-border p-4" data-testid="wizard-effects">
          <label className="flex items-center justify-between gap-3 text-sm">
            {t("wizard.fireworks")}
            <Switch checked={fx.fireworks} onCheckedChange={(v) => set({ fireworks: v })} data-testid="wizard-effects-fireworks-switch" />
          </label>
          <label className={`flex items-center justify-between gap-3 text-sm ${fx.fireworks ? "" : "opacity-50"}`}>
            <span>{t("wizard.vibration")}<span className="mt-0.5 block text-xs text-muted-foreground">{t("wizard.vibrationHint")}</span></span>
            <Switch checked={fx.fireworks && fx.vibration} disabled={!fx.fireworks} onCheckedChange={(v) => set({ vibration: v })} data-testid="wizard-effects-vibration-switch" />
          </label>
          <div className={`flex flex-wrap items-center gap-2 ${fx.fireworks ? "" : "pointer-events-none opacity-50"}`}>
            <span className="text-sm text-muted-foreground">{t("wizard.intensity")}:</span>
            {["low", "medium", "high"].map((k) => (
              <button key={k} type="button" onClick={() => set({ intensity: k })} data-testid={`wizard-effects-intensity-${k}`}
                className={`rounded-full border px-4 py-1.5 text-xs ${fx.intensity === k ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"}`}>
                {t(`wizard.intensities.${k}`)}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
            <span>{t("wizard.timelineArt")}<span className="mt-0.5 block text-xs text-muted-foreground">{t("wizard.timelineArtHint")}</span></span>
            <Switch checked={card.timeline_art !== false} onCheckedChange={(v) => update({ timeline_art: v })} data-testid="wizard-timeline-art-switch" />
          </label>
        </div>
      </Field>
    </div>
  );
};

export const Field = ({ label, hint, children }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const HeadingFontPicker = ({ value, onChange }) => {
  useEffect(() => Object.entries(HEADING_FONTS).forEach(([id, f]) => loadFont(`heading-${id}`, f.href)), []);
  return (
    <Field label={t("wizard.headingFont")} hint={t("wizard.headingFontHint")}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="wizard-heading-font-picker">
        {["default", ...Object.keys(HEADING_FONTS)].map((id) => (
          <button key={id} type="button" onClick={() => onChange(id)} data-testid={`wizard-heading-font-${id}`}
            className={`flex min-w-0 flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors ${value === id ? "border-gold ring-2 ring-gold/30" : "border-border hover:border-gold/50"}`}>
            <span className="text-2xl leading-tight text-foreground" style={{ fontFamily: HEADING_FONTS[id] ? `${HEADING_FONTS[id].family}, ${HEADING_FONTS[id].generic}` : undefined }}>Aa</span>
            <span className="mt-1 text-xs text-muted-foreground">{t(`wizard.fonts.${id}`)}</span>
          </button>
        ))}
      </div>
    </Field>
  );
};

export const StepDetails = ({ card, update, onLanguage }) => {
  const L = t("wizard.labels");
  const typeL = L[card.event_type];
  const ct = makeT(card.language);
  const bind = (key) => ({ value: card[key] || "", onChange: (e) => update({ [key]: e.target.value }), "data-testid": `wizard-${key.replace(/_/g, "-")}-input`, dir: "auto" });
  return (
    <>
      <StepTitle>{t("wizard.detailsTitle")}</StepTitle>
      <div className="grid gap-5">
        <Field label={t("wizard.language")} hint={t("wizard.languageHint")}>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.code} type="button" onClick={() => onLanguage(l.code)} data-testid={`wizard-language-${l.code}`}
                className={`min-w-24 rounded-full border px-5 py-2.5 text-sm transition-colors ${card.language === l.code ? "border-gold bg-gold text-background" : "border-border hover:border-gold/50"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={typeL.primary}><Input className="h-12 rounded-xl text-base" maxLength={60} {...bind("primary_name")} /></Field>
          <Field label={`${typeL.secondary}`}><Input className="h-12 rounded-xl text-base" maxLength={60} {...bind("secondary_name")} /></Field>
        </div>
        <HeadingFontPicker value={card.heading_font || "default"} onChange={(v) => update({ heading_font: v })} />
        <IntroTitleField card={card} update={update} />
        <HeaderPicker card={card} update={update} />
        {["wedding", "engagement"].includes(card.event_type) && <FamilyFields card={card} update={update} />}
        <Field label={card.event_type === "corporate" ? t("wizard.hostedBy") : L.host} hint={L.hostHint}><Input className="h-12 rounded-xl text-base" maxLength={120} {...bind("host_family")} /></Field>
        <Field label={L.title} hint="Leave empty to use the occasion name."><Input className="h-12 rounded-xl text-base" maxLength={120} placeholder={occasionName(card)} {...bind("title")} data-testid="wizard-title-input" /></Field>
        {card.events.length > 1 && (
          <Field label={t("wizard.hubHeading")} hint={t("wizard.hubHeadingHint")}>
            <Input className="h-12 rounded-xl text-base" maxLength={80} value={card.hub_heading || ct(`guest.hub.${card.event_type}`)} dir="auto"
              onChange={(e) => update({ hub_heading: e.target.value === ct(`guest.hub.${card.event_type}`) ? "" : e.target.value })} data-testid="wizard-hub-heading-input" />
          </Field>
        )}
        <Field label={L.invitation} hint="Leave empty to use the tradition's wording shown here. Only one invitation paragraph is shown.">
          <Textarea className="min-h-24 rounded-xl text-base" maxLength={1500} placeholder={invitationParagraph({ ...card, invitation_text: "" })} {...bind("invitation_text")} data-testid="wizard-invitation-input" />
          <SlotWarning card={card} slot="invitation" />
        </Field>
        <Field label={t("wizard.welcomeText")} hint={t("wizard.welcomeTextHint")}>
          <Textarea className="min-h-20 rounded-xl text-base" maxLength={400} dir="auto" value={card.welcome_text || ""} placeholder="Optional. Leave empty to show nothing."
            onChange={(e) => update({ welcome_text: e.target.value })} data-testid="wizard-welcome-text-input" />
          <SlotWarning card={card} slot="welcome" />
        </Field>
        <Field label={L.blessing}>
          <div className="flex flex-wrap gap-2">
            {t(`blessingOptions.${card.event_type}`).map((k) => (
              <button key={k} type="button" onClick={() => update({ blessing_key: k })} data-testid={`wizard-blessing-${k}`}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${card.blessing_key === k ? "border-gold bg-gold text-background" : "border-border hover:border-gold/50"}`}>
                {t(`blessingLabels.${k}`)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm italic text-muted-foreground" dir="auto">{card.blessing_key !== "custom" && blessingText(ct, card)}</p>
          <SlotWarning card={card} slot="blessing" />
        </Field>
        {card.blessing_key === "custom" && <Field label={L.blessingCustom}><Textarea className="rounded-xl text-base" maxLength={1000} {...bind("blessing_text")} /></Field>}
        <Field label={`${L.whatsapp} (${L.optional})`} hint={L.whatsappHint}>
          <Input type="tel" inputMode="tel" className="h-12 rounded-xl text-base" placeholder="+91 98765 43210" maxLength={20} {...bind("host_whatsapp")} />
        </Field>
      </div>
      <TextSummary card={card} />
    </>
  );
};

export const StepMusic = ({ card, update }) => {
  const [playing, setPlaying] = useState(null);
  const player = useRef(null);
  const stop = () => { player.current?.stop(); player.current = null; setPlaying(null); };
  const toggle = (id) => {
    if (playing === id) return stop();
    stop();
    player.current = createPlayer(id);
    player.current?.start();
    setPlaying(id);
  };
  useEffect(() => () => player.current?.stop(), []);
  return (
    <>
      <StepTitle hint={t("wizard.musicHint")}>{t("wizard.musicTitle")}</StepTitle>
      <div className="grid gap-3">
        {MUSIC_TRACKS.map((id) => (
          <div key={id} className={`choice-tile ${card.music_track === id ? "is-active" : ""}`}>
            <button type="button" className="flex flex-1 items-center gap-4 text-left" onClick={() => update({ music_track: id })} data-testid={`wizard-music-${id}`}>
              <Music size={20} className="text-gold" />
              <span><span className="block font-semibold text-foreground">{t(`music.${id}`)}</span><span className="block text-xs text-muted-foreground">{t(`musicHints.${id}`)}</span></span>
            </button>
            {id !== "none" && (
              <button type="button" onClick={() => toggle(id)} className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-gold" aria-label={playing === id ? t("wizard.stop") : t("wizard.play")} data-testid={`wizard-music-preview-${id}`}>
                {playing === id ? <Pause size={15} /> : <Play size={15} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
