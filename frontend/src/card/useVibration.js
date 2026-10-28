import { useEffect, useMemo, useRef } from "react";

const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;

// Short pulses where navigator.vibrate exists (silent on iPhone): only after the first tap, max one per 3 s, paused while typing.
export const useVibration = (rootRef, enabled) => {
  const tapped = useRef(false);
  const typing = useRef(false);
  const last = useRef(0);
  const on = useRef(enabled);
  on.current = enabled;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const tap = () => { tapped.current = true; };
    const focusIn = (e) => { typing.current = FIELD.test(e.target.tagName); };
    const focusOut = () => { typing.current = false; };
    el.addEventListener("pointerdown", tap, { passive: true });
    el.addEventListener("focusin", focusIn);
    el.addEventListener("focusout", focusOut);
    return () => {
      el.removeEventListener("pointerdown", tap);
      el.removeEventListener("focusin", focusIn);
      el.removeEventListener("focusout", focusOut);
    };
  }, [rootRef]);

  return useMemo(() => {
    const buzz = (pattern) => {
      if (!on.current || !tapped.current || typing.current || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
      const now = Date.now();
      if (now - last.current < 3000) return;
      last.current = now;
      try {
        navigator.vibrate(pattern);
      } catch {
        /* unsupported */
      }
    };
    return {
      open: () => {
        tapped.current = true;
        buzz([40, 70, 35]);
      },
      pulse: () => buzz(25),
    };
  }, []);
};
