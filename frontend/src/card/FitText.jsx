import { useLayoutEffect, useRef } from "react";

// Starts at the CSS font size and shrinks until no word overflows and the text fits in maxLines.
export const FitText = ({ as: Tag = "p", className = "", maxLines = 3, children, ...rest }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      const tooBig = () => {
        const lh = parseFloat(getComputedStyle(el).lineHeight) || size * 1.2;
        return el.scrollWidth > el.clientWidth + 1 || el.offsetHeight > lh * maxLines + 4;
      };
      for (let i = 0; i < 40 && size > 14 && tooBig(); i += 1) {
        size = Math.max(14, size - Math.max(1, size * 0.06));
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    let lastW = el.parentElement?.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = el.parentElement?.clientWidth;
      if (w !== lastW) {
        lastW = w;
        fit();
      }
    });
    if (el.parentElement) ro.observe(el.parentElement);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  });
  return <Tag ref={ref} className={`gc-fit ${className}`} {...rest}>{children}</Tag>;
};
