import { photoUrl } from "@/lib/upload";

const RATIO = { portrait: "4 / 5", square: "1 / 1", wide: "16 / 9", arch: "4 / 5", circle: "1 / 1" };

// Cover photos default to the full, uncropped photo blended into the page; others to the full photo, framed.
export const photoFit = (fit, variant) => ({ shape: "full", x: 50, y: 40, zoom: 1, style: variant === "hero" ? "blended" : "framed", ...(fit || {}) });

const hasEvent = (card, place) => card.events.some((e) => `event:${e.event_id}` === place);

// The single card photo and where it shows. Older cards without a placement use their first photo on the cover.
export const mainPhoto = (card) => {
  if (card.photo_place) {
    const path = card.photos?.[0];
    const place = card.photo_place.startsWith("event:") && !hasEvent(card, card.photo_place) ? "cover" : card.photo_place;
    return path ? { path, fit: card.photo_fit?.hero, place } : null;
  }
  const legacy = [[card.photos?.[0], card.photo_fit?.hero], [card.photos?.[1], card.photo_fit?.feature],
    ...card.events.map((e) => [e.photo, e.photo_fit]), [card.wishes_photo, card.photo_fit?.wishes]].find(([p]) => p);
  return legacy ? { path: legacy[0], fit: legacy[1], place: "cover" } : null;
};

export const CardPhoto = ({ path, variant, fit, testId }) => {
  if (!path) return null;
  const f = photoFit(fit, variant);
  const pos = `${f.x}% ${f.y}%`;
  const imgStyle = f.shape === "full" ? undefined : { objectPosition: pos, transform: f.zoom > 1 ? `scale(${f.zoom})` : undefined, transformOrigin: pos };
  return (
    <figure className={`gc-photo gc-photo-${variant} has-fit shape-${f.shape} is-${f.style}`} style={RATIO[f.shape] ? { "--ar": RATIO[f.shape] } : undefined}
      data-testid={testId} data-shape={f.shape} data-style={f.style}>
      <div className="gc-photo-clip">
        <img src={photoUrl(path)} alt="" loading={variant === "hero" || variant === "intro" ? "eager" : "lazy"} decoding="async" style={imgStyle} draggable={false} />
      </div>
    </figure>
  );
};

export const PlacedPhoto = ({ card, place, variant, testId }) => {
  const m = mainPhoto(card);
  if (!m || m.place !== place) return null;
  return <CardPhoto path={m.path} fit={m.fit} variant={variant} testId={testId} />;
};
