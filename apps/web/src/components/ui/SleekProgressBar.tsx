import React from "react";

type Props = {
  label: string;
  saved: number;       // amount saved (numerator)
  baseline: number;    // baseline total (denominator) — the "without SLA" total
  format?: (val: number) => string;
  color?: "emerald" | "cyan";
  totalLabel?: string; // NEW: caption like "Total time spent" or "Total spend"
};

export default function SleekProgressBar({
  label,
  saved,
  baseline,
  format,
  color = "emerald",
  totalLabel,
}: Props) {
  const total = Math.max(1, baseline);                // avoid 0-div
  const clampedSaved = Math.min(saved, total);        // never exceed baseline
  const pct = Math.min(100, Math.max(0, (clampedSaved / total) * 100));

  const green = color === "emerald" ? "bg-emerald-500" : "bg-cyan-500";
  const greenSoft = color === "emerald"
    ? "bg-emerald-100 dark:bg-emerald-900/20"
    : "bg-cyan-100 dark:bg-cyan-900/20";

  const savedText  = format ? format(clampedSaved) : String(clampedSaved);
  const actualSpentWithSLA = Math.max(0, total - clampedSaved); // This is the actual time spent WITH SLA
  const actualSpentWithSLAText = format ? format(actualSpentWithSLA) : String(actualSpentWithSLA);

  const baselineText = format ? format(total) : String(total); // This is the original baseline (without SLA)

  return (
    <div className="w-full">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </div>

      <div className={`w-full h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 ${greenSoft}`}>
        <div className={`h-full ${green}`} style={{ width: `${pct}%` }} aria-label={`${pct.toFixed(0)}% saved`} />
        <div className="h-full bg-rose-400/0" style={{ width: `${100 - pct}%` }} aria-hidden />
      </div>

      {/* saved vs without-SLA */}
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Saved: <span className="text-emerald-700 dark:text-emerald-300">{savedText}</span></span>
        <span>Without SLA: <span className="text-rose-600 dark:text-rose-400">{baselineText}</span></span>
      </div>

      {/* NEW: centered total line (baseline - saved = actual used/spent with SLA) - Updated calculation */}
      {totalLabel && (
        <div className="mt-1 text-center text-[11px] text-slate-600 dark:text-slate-300">
          <span className="opacity-80">{totalLabel}: </span>
          <span className="font-medium">
            {actualSpentWithSLAText}
          </span>
        </div>
      )}
    </div>
  );
}
