import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { useMediaQuery } from "@/hooks/useMedia";
import { HostShell, FullLoader, PhoneFrame } from "@/components/host/HostShell";
import { GuestCard } from "@/card/GuestCard";
import { TEMPLATES, TEMPLATE_LIST } from "@/templates/registry";
import { StepDetails, StepEventType, StepMusic, StepTemplate, StepTitle } from "./wizard/Steps";
import { StepEvents, blankEvent } from "./wizard/StepEvents";
import { StepPhotos } from "./wizard/StepPhotos";
import { t, makeT } from "@/i18n";
import { weddingDefaults } from "@/i18n/traditions";
import { BLANK_HEADER } from "./wizard/HeaderBoxes";

const BLANK_FAMILY = { groom_family: "", bride_family: "", groom_parents: "", bride_parents: "", groom_grandparents: "", bride_grandparents: "", host_side: "groom", hidden: false };

const defaultCard = (type, lang = "en", tradition = "neutral") => {
  const d = makeT(lang)(`defaults.${type}`);
  const template = TEMPLATE_LIST.find((tp) => tp.eventTypes.includes(type))?.id || "wedding-royal";
  const names = (type === "wedding" && weddingDefaults(tradition)) || d.events;
  return {
    event_type: type, template, language: lang, photos: ["", ""], wishes_photo: "", heading_font: "default", primary_name: "", secondary_name: "", host_family: "",
    title: d.title, invitation_text: d.invitation, blessing_key: d.blessing, blessing_text: "",
    music_track: TEMPLATES[template].defaultMusic, host_whatsapp: "", timezone: "+05:30", status: "draft",
    tradition, header_key: "", family: BLANK_FAMILY, custom_header: BLANK_HEADER, header_per_event: false, intro_title: "", photo_fit: {},
    events: names.map((name, i) => blankEvent(name, `e${i + 1}`)),
  };
};

const FIELDS = ["event_type", "template", "language", "primary_name", "secondary_name", "host_family", "title", "invitation_text", "blessing_key", "blessing_text", "music_track", "host_whatsapp", "timezone", "events", "photos", "wishes_photo", "heading_font", "tradition", "header_key", "family", "custom_header", "header_per_event", "intro_title", "photo_fit"];

const validate = (card, step) => {
  if (step >= 2 && !card.primary_name.trim()) return t("wizard.errors.primary");
  if (step >= 3 && card.events.some((e) => !e.name.trim() || !e.date || !e.time)) return t("wizard.errors.events");
  return "";
};

const Preview = ({ card, eventId, setEventId }) => {
  const [key, setKey] = useState(0);
  return (
    <div>
      <PhoneFrame><GuestCard key={key} card={card} eventId={eventId || null} preview onSelectEvent={setEventId} /></PhoneFrame>
      <div className="mt-4 flex items-center justify-center gap-3">
        {card.events.length > 1 && (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="field-select h-10 w-auto" aria-label={t("wizard.previewEvent")} data-testid="wizard-preview-event-select">
            <option value="">{t("wizard.previewCover")}</option>
            {card.events.map((e) => <option key={e.event_id} value={e.event_id}>{e.name || e.event_id}</option>)}
          </select>
        )}
        <button type="button" onClick={() => setKey((k) => k + 1)} className="btn-chip" data-testid="wizard-preview-replay-button"><RotateCcw size={14} /> {t("wizard.replayPreview")}</button>
      </div>
    </div>
  );
};

export default function Wizard() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [card, setCard] = useState(cardId ? null : defaultCard("wedding"));
  const [step, setStep] = useState(0);
  const [eventId, setEventId] = useState("");
  const [busy, setBusy] = useState(false);
  const steps = t("wizard.steps");

  useEffect(() => {
    if (!cardId) return;
    api.get(`/cards/${cardId}`).then((r) => setCard({ tradition: "neutral", header_key: "", header_per_event: false, intro_title: "", ...r.data,
      custom_header: { ...BLANK_HEADER, ...(r.data.custom_header || {}) }, family: { ...BLANK_FAMILY, ...(r.data.family || {}) } })).catch(() => navigate("/dashboard"));
  }, [cardId, navigate]);

  if (!card) return <FullLoader />;
  const update = (patch) => setCard((c) => ({ ...c, ...patch }));
  const onType = (type) => {
    if (type === card.event_type) return;
    if (card.card_id) return update({ event_type: type, blessing_key: t(`defaults.${type}`).blessing });
    setCard({ ...defaultCard(type, card.language, card.tradition), heading_font: card.heading_font, photos: card.photos, wishes_photo: card.wishes_photo, primary_name: card.primary_name, host_family: card.host_family, host_whatsapp: card.host_whatsapp, family: card.family });
    setEventId("");
  };
  const onTradition = (tradition) => {
    if (tradition === card.tradition) return;
    const prev = weddingDefaults(card.tradition) || makeT(card.language)(`defaults.${card.event_type}`).events;
    const next = weddingDefaults(tradition) || makeT(card.language)(`defaults.${card.event_type}`).events;
    const untouched = card.event_type === "wedding" && card.events.every((e, i) => e.name === prev[i] && !e.date) && card.events.length === prev.length;
    update({ tradition, header_key: "", ...(untouched ? { events: next.map((n, i) => blankEvent(n, `e${i + 1}`)) } : {}) });
  };
  const onLanguage = (lang) => {
    const prev = makeT(card.language)(`defaults.${card.event_type}`);
    const next = makeT(lang)(`defaults.${card.event_type}`);
    const swap = (cur, a, b) => (cur === a ? b : cur);
    update({
      language: lang,
      title: swap(card.title, prev.title, next.title),
      invitation_text: swap(card.invitation_text, prev.invitation, next.invitation),
      events: card.events.map((e) => {
        const i = prev.events.indexOf(e.name);
        return i >= 0 && next.events[i] ? { ...e, name: next.events[i] } : e;
      }),
    });
  };
  const onTemplate = (id) => update({ template: id, music_track: card.music_track === TEMPLATES[card.template].defaultMusic ? TEMPLATES[id].defaultMusic : card.music_track });
  const previewEventId = card.events.some((e) => e.event_id === eventId) ? eventId : "";

  const goTo = (target) => {
    const err = target > step ? validate(card, target - 1) : "";
    if (err) return toast.error(err);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (status) => {
    const err = validate(card, 6);
    if (err) return toast.error(err);
    setBusy(true);
    const payload = Object.fromEntries(FIELDS.map((k) => [k, card[k]]));
    payload.status = status;
    try {
      const { data } = card.card_id ? await api.put(`/cards/${card.card_id}`, payload) : await api.post("/cards", payload);
      toast.success(status === "published" ? t("wizard.publishedToast") : t("wizard.saved"));
      navigate(`/cards/${data.card_id}`);
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(false);
    }
  };

  const body = [
    <StepEventType card={card} onType={onType} onTradition={onTradition} />,
    <StepTemplate card={card} onTemplate={onTemplate} />,
    <StepDetails card={card} update={update} onLanguage={onLanguage} />,
    <StepEvents card={card} update={update} />,
    <StepPhotos card={card} update={update} />,
    <StepMusic card={card} update={update} />,
    <>
      <StepTitle hint={t("wizard.previewHint")}>{t("wizard.previewTitle")}</StepTitle>
      <p className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold" data-testid="wizard-wording-check-publish">{t("wizard.wordingCheck")}</p>
      {!desktop && <Preview card={card} eventId={previewEventId} setEventId={setEventId} />}
      <div className="mt-8 flex flex-wrap gap-3">
        {card.status !== "published" && <button type="button" disabled={busy} onClick={() => save("draft")} className="btn-outline" data-testid="wizard-save-draft-button">{t("wizard.saveDraft")}</button>}
        <button type="button" disabled={busy} onClick={() => save("published")} className="btn-gold" data-testid="wizard-publish-button">
          {card.status === "published" ? t("wizard.saveChanges") : t("wizard.publish")}
        </button>
      </div>
    </>,
  ][step];

  return (
    <HostShell>
      <Link to={card.card_id ? `/cards/${card.card_id}` : "/dashboard"} className="text-sm text-muted-foreground hover:text-foreground">← {t("dashboard.title")}</Link>
      <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">{card.card_id ? t("wizard.editTitle") : t("wizard.newTitle")}</h1>
      <div className="mt-6 sm:hidden" data-testid="wizard-progress-mobile">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm font-semibold text-foreground" data-testid="wizard-progress-label">{t("wizard.stepOf", { n: step + 1, total: steps.length, name: steps[step] })}</p>
          <select value={step} onChange={(e) => goTo(Number(e.target.value))} aria-label={t("wizard.jumpStep")} className="field-select shrink-0 text-sm" style={{ width: 132, height: 40 }} data-testid="wizard-step-select">
            {steps.map((s, i) => <option key={s} value={i}>{i + 1}. {s}</option>)}
          </select>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="mt-8 hidden gap-2 overflow-x-auto pb-2 sm:flex" data-testid="wizard-progress">
        {steps.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => goTo(i)} data-testid={`wizard-step-tab-${i}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${i === step ? "bg-gold text-background" : i < step ? "bg-secondary text-foreground" : "border border-border text-muted-foreground"}`}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 gap-12 lg:grid lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 pb-28 fade-up" key={step}>
          {body}
          <div className="wizard-nav">
            <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0} className="btn-outline" data-testid="wizard-back-button"><ArrowLeft size={16} /> {t("common.back")}</button>
            {step < steps.length - 1 && <button type="button" onClick={() => goTo(step + 1)} className="btn-gold" data-testid="wizard-next-step-button">{t("common.next")} <ArrowRight size={16} /></button>}
          </div>
        </div>
        {desktop && <aside className="sticky top-24 self-start"><Preview card={card} eventId={previewEventId} setEventId={setEventId} /></aside>}
      </div>
    </HostShell>
  );
}
