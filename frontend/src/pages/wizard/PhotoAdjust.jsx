import { useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { CardPhoto, photoFit } from "@/card/CardPhoto";
import { getTemplate, themeVars } from "@/templates/registry";
import { colorVars } from "@/templates/eventColors";
import { t } from "@/i18n";
import "@/templates/templates.css";
import "@/templates/more.css";
import "@/card/pages.css";

const SHAPES = ["full", "portrait", "square", "wide", "arch", "circle"];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Best effort face centring (Chrome's FaceDetector); otherwise keep the upper-middle default.
export const faceFocus = async (file) => {
  try {
    if (!("FaceDetector" in window)) return {};
    const bmp = await createImageBitmap(file);
    const faces = await new window.FaceDetector({ fastMode: true }).detect(bmp);
    if (!faces.length) return {};
    const b = faces[0].boundingBox;
    return { x: Math.round(((b.x + b.width / 2) / bmp.width) * 100), y: Math.round(((b.y + b.height / 2) / bmp.height) * 100) };
  } catch {
    return {};
  }
};

const Chips = ({ items, value, onPick, prefix, testId }) => (
  <div className="flex flex-wrap gap-1.5" data-testid={testId}>
    {items.map((k) => (
      <button key={k} type="button" onClick={() => onPick(k)} data-testid={`${testId}-${k}`}
        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${value === k ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>
        {t(`${prefix}.${k}`)}
      </button>
    ))}
  </div>
);

export const PhotoAdjust = ({ open, onOpenChange, card, path, variant, fit, onFit, testId }) => {
  const f = photoFit(fit, variant);
  const tpl = getTemplate(card.template);
  const set = (patch) => onFit({ ...f, ...patch });
  const pointers = useRef(new Map());
  const start = useRef(null);
  const box = useRef(null);
  const movable = f.shape !== "full";

  const down = (e) => {
    if (!movable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    start.current = { f, pts, dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0 };
  };
  const move = (e) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const s = start.current;
    if (pts.length === 2 && s.dist) {
      set({ zoom: clamp(s.f.zoom * (Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / s.dist), 1, 4) });
      return;
    }
    const r = box.current.getBoundingClientRect();
    const dx = ((pts[0].x - s.pts[0].x) / r.width) * 100 / s.f.zoom;
    const dy = ((pts[0].y - s.pts[0].y) / r.height) * 100 / s.f.zoom;
    set({ x: Math.round(clamp(s.f.x - dx * 1.6, 0, 100)), y: Math.round(clamp(s.f.y - dy * 1.6, 0, 100)) });
  };
  const up = (e) => {
    pointers.current.delete(e.pointerId);
    start.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-24px)] max-w-lg overflow-y-auto p-4 sm:p-6" data-testid={testId}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("wizard.adjustTitle")}</DialogTitle>
          <DialogDescription>{t("wizard.adjustHint")}</DialogDescription>
        </DialogHeader>
        <div className="relative h-[320px] overflow-hidden rounded-2xl border border-border">
          <div className={`gc-root ${tpl.className}`} style={colorVars(themeVars(tpl, card.language || "en", card.heading_font || "default"))}>
            <div className="gc-scroller grid place-items-center p-6" style={{ touchAction: movable ? "none" : "auto", cursor: movable ? "grab" : "default" }}
              ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} data-testid={`${testId}-preview`}>
              <CardPhoto path={path} fit={f} variant={variant} testId={`${testId}-photo`} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div><p className="field-label">{t("wizard.shape")}</p><Chips items={SHAPES} value={f.shape} onPick={(shape) => set({ shape })} prefix="wizard.shapes" testId={`${testId}-shape`} /></div>
          <div><p className="field-label">{t("wizard.photoStyle")}</p><Chips items={["blended", "framed"]} value={f.style} onPick={(style) => set({ style })} prefix="wizard.styles" testId={`${testId}-style`} /></div>
          {movable && (
            <div>
              <p className="field-label">{t("wizard.zoom")}</p>
              <Slider min={1} max={4} step={0.05} value={[f.zoom]} onValueChange={([zoom]) => set({ zoom })} data-testid={`${testId}-zoom`} />
            </div>
          )}
          <button type="button" onClick={() => onOpenChange(false)} className="btn-gold w-full" data-testid={`${testId}-done`}>{t("wizard.done")}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
