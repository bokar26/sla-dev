import { useEffect, useRef, useState } from "react";

type Opts = {
  from?: number;     // default 0
  to: number;        // target value
  duration?: number; // ms, default 1200
  start?: boolean;   // when true, animation begins
  decimals?: number; // digits after decimal, default 0
};

export function useCountUp({ from = 0, to, duration = 1200, start = false, decimals = 0 }: Opts) {
  const [value, setValue] = useState(from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(to);
      return;
    }

    const t0 = performance.now();
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const next = from + (to - from) * easeOutCubic(p);
      const factor = Math.pow(10, decimals);
      setValue(Math.round(next * factor) / factor);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration, start, decimals]);

  return value;
}
