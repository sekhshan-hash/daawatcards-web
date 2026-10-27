import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const isField = (el) => /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName || "") || el?.isContentEditable;

// Horizontal full-screen pages on native scroll-snap; each page scrolls vertically on its own.
export const SwipePages = ({ count, start, target, locked, reduced, dir, onIndex, renderPage, pageStyle, dotColors, t }) => {
  const track = useRef(null);
  const indexRef = useRef(start);
  const [index, setIndex] = useState(start);
  const [swiped, setSwiped] = useState(start > 0);
  const [moving, setMoving] = useState(false);
  const sign = dir === "rtl" ? -1 : 1;

  const goTo = useCallback((i, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: sign * n * el.clientWidth, behavior: smooth && !reduced ? "smooth" : "auto" });
  }, [count, sign, reduced]);

  useLayoutEffect(() => goTo(start, false), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (target) goTo(target.i, target.smooth);
  }, [target, goTo]);

  useEffect(() => {
    const el = track.current;
    let raf = 0;
    let stop = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
        if (i !== indexRef.current) {
          indexRef.current = i;
          setIndex(i);
          onIndex(i);
          if (i > 0) setSwiped(true);
        }
      });
      setMoving(true);
      clearTimeout(stop);
      stop = setTimeout(() => setMoving(false), 140);
    };
    const onResize = () => goTo(indexRef.current, false);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      clearTimeout(stop);
    };
  }, [onIndex, goTo]);

  useEffect(() => {
    if (locked) return undefined;
    const onKey = (e) => {
      if (isField(document.activeElement) || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
      const step = (e.key === "ArrowRight" ? 1 : -1) * sign;
      goTo(indexRef.current + step);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, sign, goTo]);

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || locked || isField(e.target)) return;
    const el = track.current;
    const x0 = e.clientX;
    const left0 = el.scrollLeft;
    let dragging = false;
    const move = (ev) => {
      const dx = ev.clientX - x0;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        el.classList.add("is-dragging");
      }
      if (dragging) el.scrollLeft = left0 - dx;
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!dragging) return;
      el.classList.remove("is-dragging");
      const moved = (-(ev.clientX - x0) * sign) / el.clientWidth;
      const from = Math.abs(left0) / el.clientWidth;
      goTo(Math.round(from + moved + (Math.abs(moved) > 0.12 ? Math.sign(moved) * 0.4 : 0)));
      const block = (c) => {
        c.stopPropagation();
        c.preventDefault();
      };
      window.addEventListener("click", block, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", block, { capture: true }), 50);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      <div ref={track} className={`gc-pages ${locked ? "is-locked" : ""} ${moving ? "is-moving" : ""}`} onPointerDown={onPointerDown} data-testid="swipe-pages" data-page={index}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`gc-scroller gc-page ${i === index ? "is-active" : ""}`} style={pageStyle(i)}
            aria-label={t("guest.pageOf", { n: i + 1, total: count })} data-testid={`swipe-page-${i}`}>
            {renderPage(i, goTo)}
          </div>
        ))}
      </div>
      {!locked && (
        <nav className="gc-dots" data-testid="swipe-dots">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} className={i === index ? "is-active" : ""} style={{ "--dot": dotColors[i] }}
              aria-label={t("guest.goTo", { n: i + 1 })} aria-current={i === index} data-testid={`swipe-dot-${i}`} />
          ))}
        </nav>
      )}
      {!locked && !swiped && index === 0 && (
        <div className="gc-swipe-hint" aria-hidden="true" data-testid="swipe-hint">{t("guest.swipe")} {dir === "rtl" ? "←" : "→"}</div>
      )}
    </>
  );
};
