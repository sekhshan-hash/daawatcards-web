import { photoUrl } from "@/lib/upload";

export const CardPhoto = ({ path, variant, testId }) =>
  path ? (
    <figure className={`gc-photo gc-photo-${variant}`} data-testid={testId}>
      <img src={photoUrl(path)} alt="" loading={variant === "hero" ? "eager" : "lazy"} decoding="async" />
    </figure>
  ) : null;
