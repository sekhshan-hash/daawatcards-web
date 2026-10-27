import { photoUrl } from "@/lib/upload";

const RATIO = { portrait: "4 / 5", square: "1 / 1", wide: "16 / 9", arch: "4 / 5", circle: "1 / 1" };

// Cover photos default to the full, uncropped photo blended into the page; others to the full photo, framed.
export const photoFit = (fit, variant) => ({ shape: "full", x: 50, y: 40, zoom: 1, style: variant === "hero" ? "blended" : "framed", ...(fit || {}) });

export const CardPhoto = ({ path, variant, fit, testId }) => {
  if (!path) return null;
  const f = photoFit(fit, variant);
  const pos = `${f.x}% ${f.y}%`;
  const imgStyle = f.shape === "full" ? undefined : { objectPosition: pos, transform: f.zoom > 1 ? `scale(${f.zoom})` : undefined, transformOrigin: pos };
  return (
    <figure className={`gc-photo gc-photo-${variant} has-fit shape-${f.shape} is-${f.style}`} style={RATIO[f.shape] ? { "--ar": RATIO[f.shape] } : undefined}
      data-testid={testId} data-shape={f.shape} data-style={f.style}>
      <div className="gc-photo-clip">
        <img src={photoUrl(path)} alt="" loading={variant === "hero" ? "eager" : "lazy"} decoding="async" style={imgStyle} draggable={false} />
      </div>
    </figure>
  );
};
