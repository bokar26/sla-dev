// src/hooks/useViewportScrollPane.js
import { useLayoutEffect, useRef, useCallback } from "react";

/**
 * Assign to a container that should fill the remaining viewport height from its top.
 * It measures the element's top offset and sets an explicit height so it can scroll.
 */
export default function useViewportScrollPane() {
  const ref = useRef(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const { top } = el.getBoundingClientRect();
    const style = getComputedStyle(document.documentElement);
    const safeBottom = parseInt(style.getPropertyValue("--safe-area-inset-bottom") || "0", 10) || 0;

    const h = Math.max(0, window.innerHeight - top - safeBottom);
    el.style.height = `${h}px`;
  }, []);

  useLayoutEffect(() => {
    const onResize = () => measure();
    measure();
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 0);

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [measure]);

  return ref;
}
