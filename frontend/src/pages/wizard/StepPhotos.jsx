import { useRef, useState } from "react";
import { toast } from "sonner";
import { Crop, ImagePlus, Trash2 } from "lucide-react";
import { errMsg } from "@/lib/api";
import { photoUrl, uploadPhoto } from "@/lib/upload";
import { mainPhoto, photoFit } from "@/card/CardPhoto";
import { PhotoAdjust, faceFocus } from "./PhotoAdjust";
import { Field, StepTitle } from "./Steps";
import { t } from "@/i18n";

export const PhotoSlot = ({ label, hint, value, onChange, testId, tall, card, variant, fit, onFit }) => {
  const [busy, setBusy] = useState(false);
  const [adjust, setAdjust] = useState(false);
  const input = useRef(null);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const focus = await faceFocus(file);
      const path = await uploadPhoto(file);
      onChange(path, onFit ? { ...photoFit(null, variant), ...focus } : undefined);
      if (onFit) setAdjust(true);
    } catch (err) {
      toast.error(errMsg(err, t("wizard.uploadError")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4" data-testid={testId}>
      <button type="button" onClick={() => input.current?.click()} disabled={busy}
        className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-background ${tall ? "h-28 w-22" : "h-20 w-28"}`}
        style={tall ? { width: 88 } : undefined} aria-label={label}>
        {busy ? <div className="loader-ring" /> : value ? <img src={photoUrl(value)} alt="" className="h-full w-full object-cover" data-testid={`${testId}-preview`} /> : <ImagePlus size={22} className="text-gold" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-chip" data-testid={`${testId}-upload-button`}>
            {busy ? t("wizard.uploading") : value ? t("wizard.change") : t("wizard.upload")}
          </button>
          {value && !busy && onFit && (
            <button type="button" onClick={() => setAdjust(true)} className="btn-chip" data-testid={`${testId}-adjust-button`}><Crop size={13} /> {t("wizard.adjust")}</button>
          )}
          {value && !busy && (
            <button type="button" onClick={() => onChange("")} className="btn-chip text-rose" data-testid={`${testId}-remove-button`}><Trash2 size={13} /> {t("wizard.remove")}</button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden onChange={pick} data-testid={`${testId}-input`} />
      {onFit && value && <PhotoAdjust open={adjust} onOpenChange={setAdjust} card={card} path={value} variant={variant} fit={fit} onFit={onFit} testId={`${testId}-adjust`} />}
    </div>
  );
};

const VARIANT = { cover: "hero", intro: "intro", wishes: "wishes" };

export const StepPhotos = ({ card, update, onPlace, onSkip }) => {
  const path = card.photos?.[0] || "";
  const place = mainPhoto({ ...card, photo_place: card.photo_place || "cover" })?.place || "cover";
  const variant = VARIANT[place] || "event";
  const setPhoto = (v, f) => update({ photos: [v, card.photos?.[1] || ""], photo_place: card.photo_place || "cover", ...(f ? { photo_fit: { ...(card.photo_fit || {}), hero: f } } : {}) });
  const setFit = (f) => update({ photo_fit: { ...(card.photo_fit || {}), hero: f } });
  const choose = (p) => {
    update({ photo_place: p });
    onPlace(p);
  };
  return (
    <>
      <StepTitle hint={t("wizard.photosHint")}>{t("wizard.photosTitle")}</StepTitle>
      <div className="grid grid-cols-1 gap-4">
        <PhotoSlot card={card} tall variant={variant} fit={card.photo_fit?.hero} onFit={setFit} label={t("wizard.photoSingle")} hint={t("wizard.photoSingleHint")}
          value={path} onChange={setPhoto} testId="wizard-photo-main" />
        {path ? (
          <Field label={t("wizard.showOn")}>
            <select value={place} onChange={(e) => choose(e.target.value)} className="field-select" data-testid="wizard-photo-place-select">
              <option value="cover">{t("wizard.placeCover")}</option>
              <option value="intro">{t("wizard.placeIntro")}</option>
              {card.events.map((ev) => <option key={ev.event_id} value={`event:${ev.event_id}`}>{ev.name || ev.event_id}</option>)}
              <option value="wishes">{t("wizard.placeWishes")}</option>
            </select>
          </Field>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-4" data-testid="wizard-photo-empty">
            <p className="text-sm text-muted-foreground">{t("wizard.photoSkipped")}</p>
            <button type="button" onClick={onSkip} className="btn-outline mt-3" data-testid="wizard-photo-skip-button">{t("wizard.skipPhoto")}</button>
          </div>
        )}
      </div>
    </>
  );
};
