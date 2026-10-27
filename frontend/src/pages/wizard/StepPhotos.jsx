import { useRef, useState } from "react";
import { toast } from "sonner";
import { Crop, ImagePlus, Trash2 } from "lucide-react";
import { errMsg } from "@/lib/api";
import { photoUrl, uploadPhoto } from "@/lib/upload";
import { photoFit } from "@/card/CardPhoto";
import { PhotoAdjust, faceFocus } from "./PhotoAdjust";
import { StepTitle } from "./Steps";
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

export const StepPhotos = ({ card, update }) => {
  const photos = [card.photos?.[0] || "", card.photos?.[1] || ""];
  const fitOf = (k) => card.photo_fit?.[k];
  const fits = (k, f) => (f ? { photo_fit: { ...(card.photo_fit || {}), [k]: f } } : {});
  const setPhoto = (i, v, f) => update({ photos: photos.map((p, j) => (j === i ? v : p)), ...fits(i ? "feature" : "hero", f) });
  const setEventPhoto = (i, patch) => update({ events: card.events.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const setFit = (k) => (f) => update(fits(k, f));
  const common = { card };
  return (
    <>
      <StepTitle hint={t("wizard.photosHint")}>{t("wizard.photosTitle")}</StepTitle>
      <div className="grid grid-cols-1 gap-3">
        <PhotoSlot {...common} tall variant="hero" fit={fitOf("hero")} onFit={setFit("hero")} label={t("wizard.photo1")} hint={t("wizard.photo1Hint")} value={photos[0]} onChange={(v, f) => setPhoto(0, v, f)} testId="wizard-photo-hero" />
        <PhotoSlot {...common} tall variant="feature" fit={fitOf("feature")} onFit={setFit("feature")} label={t("wizard.photo2")} hint={t("wizard.photo2Hint")} value={photos[1]} onChange={(v, f) => setPhoto(1, v, f)} testId="wizard-photo-feature" />
        {card.events.map((ev, i) => (
          <PhotoSlot {...common} key={ev.event_id} variant="event" fit={ev.photo_fit} onFit={(f) => setEventPhoto(i, { photo_fit: f })}
            label={t("wizard.eventPhoto", { event: ev.name || ev.event_id })} hint={t("wizard.eventPhotoHint")}
            value={ev.photo || ""} onChange={(v, f) => setEventPhoto(i, { photo: v, ...(f ? { photo_fit: f } : {}) })} testId={`wizard-photo-event-${i}`} />
        ))}
        <PhotoSlot {...common} tall variant="wishes" fit={fitOf("wishes")} onFit={setFit("wishes")} label={t("wizard.wishesPhoto")} hint={t("wizard.wishesPhotoHint")} value={card.wishes_photo || ""} onChange={(v, f) => update({ wishes_photo: v, ...fits("wishes", f) })} testId="wizard-photo-wishes" />
      </div>
    </>
  );
};
