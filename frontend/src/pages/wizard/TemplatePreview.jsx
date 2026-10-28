import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMedia";
import { PhoneFrame } from "@/components/host/HostShell";
import { GuestCard } from "@/card/GuestCard";
import { TEMPLATES } from "@/templates/registry";
import { COUPLE_TYPES, makeT, t } from "@/i18n";

const SAMPLE = {
  en: { couple: ["Shahnawaz", "Farah"], one: "Zara" },
  hi: { couple: ["शाहनवाज़", "फ़राह"], one: "ज़ारा" },
  ur: { couple: ["شاہنواز", "فرح"], one: "زارا" },
};

const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export const sampleCard = (card, tpl) => {
  const lang = card.language || "en";
  const s = SAMPLE[lang] || SAMPLE.en;
  const couple = COUPLE_TYPES.includes(card.event_type);
  const names = makeT(lang)(`defaults.${card.event_type}`).events || [];
  return {
    ...card, template: tpl.id,
    music_track: card.template === tpl.id ? card.music_track : tpl.defaultMusic,
    primary_name: card.primary_name?.trim() || (couple ? s.couple[0] : s.one),
    secondary_name: card.secondary_name?.trim() || (couple ? s.couple[1] : card.secondary_name),
    events: card.events.map((e, i) => ({ ...e, name: e.name || names[i] || "—", date: e.date || inDays(30 + i), time: e.time || "18:00" })),
  };
};

const Ctrl = ({ onClick, label, testId, children, gold }) => (
  <button type="button" onClick={onClick} aria-label={label} data-testid={testId}
    className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${gold ? "bg-gold text-background hover:bg-gold/90" : "border border-white/20 bg-white/10 text-white hover:bg-white/20"}`}>
    {children}
  </button>
);

export const TemplatePreview = ({ tplId, card, onClose, onUse }) => {
  const desktop = useMediaQuery("(min-width: 768px)");
  const tpl = TEMPLATES[tplId];
  const demo = useMemo(() => sampleCard(card, tpl), [card, tpl]);
  const [run, setRun] = useState(0);
  const [sound, setSound] = useState(true);
  const hasMusic = demo.music_track && demo.music_track !== "none";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const view = <GuestCard key={run} card={demo} preview soundOn={sound} />;
  const controls = (
    <>
      <Ctrl onClick={() => setRun((r) => r + 1)} label={t("wizard.tplReplay")} testId="template-preview-replay"><RotateCcw size={16} /> {t("wizard.tplReplay")}</Ctrl>
      {hasMusic && (
        <Ctrl onClick={() => setSound((v) => !v)} label={sound ? t("wizard.tplMute") : t("wizard.tplUnmute")} testId="template-preview-music">
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </Ctrl>
      )}
      <Ctrl onClick={() => onUse(tplId)} gold label={t("wizard.tplUse")} testId="template-preview-use"><Check size={16} /> {t("wizard.tplUse")}</Ctrl>
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md fade-up" role="dialog" aria-modal="true" aria-label={t(`templates.${tplId}.name`)} data-testid="template-preview">
      {desktop ? (
        <div className="flex h-full items-center justify-center gap-12 p-8">
          <div className="max-h-full">{<PhoneFrame>{view}</PhoneFrame>}</div>
          <div className="flex w-56 flex-col gap-3">
            <p className="font-display text-3xl text-white" data-testid="template-preview-name">{t(`templates.${tplId}.name`)}</p>
            <p className="mb-3 text-sm text-white/70">{t(`templates.${tplId}.desc`)}</p>
            {controls}
            <Ctrl onClick={onClose} label={t("wizard.tplClose")} testId="template-preview-close"><X size={16} /> {t("wizard.tplClose")}</Ctrl>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10" aria-label={t("wizard.tplClose")} data-testid="template-preview-close"><X size={20} /></button>
            <p className="truncate font-display text-lg text-white" data-testid="template-preview-name">{t(`templates.${tplId}.name`)}</p>
            <span className="w-11" />
          </div>
          <div className="relative min-h-0 flex-1">{view}</div>
          <div className="flex items-center justify-center gap-2 px-3 py-3">{controls}</div>
        </div>
      )}
    </div>,
    document.body,
  );
};
