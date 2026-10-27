import { useEffect, useRef, useState } from "react";
import { HEADING_FONTS, loadFont } from "@/templates/registry";
import { Baby, Briefcase, Cake, Check, Gem, Gift, Heart, Home, Music, Pause, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TEMPLATE_LIST } from "@/templates/registry";
import { createPlayer, MUSIC_TRACKS } from "@/lib/music";
import { t, makeT, LANGUAGES, blessingText } from "@/i18n";

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

export const StepEventType = ({ card, onType }) => (
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
  </>
);

export const StepTemplate = ({ card, onTemplate }) => {
  useEffect(() => TEMPLATE_LIST.forEach((tp) => loadFont(tp.id, tp.fontsHref)), []);
  const list = [...TEMPLATE_LIST].sort((a, b) => b.eventTypes.includes(card.event_type) - a.eventTypes.includes(card.event_type));
  return (
    <>
      <StepTitle>{t("wizard.templateTitle")}</StepTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((tpl) => (
          <button key={tpl.id} type="button" onClick={() => onTemplate(tpl.id)} data-testid={`wizard-template-${tpl.id}`}
            className={`overflow-hidden rounded-2xl border text-left transition-colors ${card.template === tpl.id ? "border-gold ring-2 ring-gold/30" : "border-border hover:border-gold/40"}`}>
            <div className="relative grid h-36 place-items-center" style={{ background: `radial-gradient(circle at 50% 30%, ${tpl.swatch[1]}, ${tpl.swatch[0]} 75%)` }}>
              <span style={{ fontFamily: tpl.fonts.display.join(", "), color: tpl.swatch[2] }} className="text-4xl">{tpl.sample}</span>
              {tpl.eventTypes.includes(card.event_type) && <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white">{t("wizard.recommended")}</span>}
            </div>
            <div className="p-4">
              <p className="font-semibold text-foreground">{t(`templates.${tpl.id}.name`)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`templates.${tpl.id}.desc`)}</p>
            </div>
          </button>
        ))}
      </div>
    </>
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
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible" data-testid="wizard-heading-font-picker">
        {["default", ...Object.keys(HEADING_FONTS)].map((id) => (
          <button key={id} type="button" onClick={() => onChange(id)} data-testid={`wizard-heading-font-${id}`}
            className={`flex min-w-[132px] shrink-0 flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors ${value === id ? "border-gold ring-2 ring-gold/30" : "border-border hover:border-gold/50"}`}>
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
        <Field label={card.event_type === "corporate" ? t("wizard.hostedBy") : L.host} hint={L.hostHint}><Input className="h-12 rounded-xl text-base" maxLength={120} {...bind("host_family")} /></Field>
        <Field label={L.title}><Input className="h-12 rounded-xl text-base" maxLength={120} {...bind("title")} /></Field>
        <Field label={L.invitation}><Textarea className="min-h-24 rounded-xl text-base" maxLength={1500} {...bind("invitation_text")} /></Field>
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
        </Field>
        {card.blessing_key === "custom" && <Field label={L.blessingCustom}><Textarea className="rounded-xl text-base" maxLength={1000} {...bind("blessing_text")} /></Field>}
        <Field label={`${L.whatsapp} (${L.optional})`} hint={L.whatsappHint}>
          <Input type="tel" inputMode="tel" className="h-12 rounded-xl text-base" placeholder="+91 98765 43210" maxLength={20} {...bind("host_whatsapp")} />
        </Field>
      </div>
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
