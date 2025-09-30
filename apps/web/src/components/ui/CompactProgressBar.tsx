import React from "react";

type Props = {
  label: string;
  saved: number;       // amount saved (numerator)
  baseline: number;    // baseline total (denominator) — the "without SLA" total
  format?: (val: number) => string;
  color?: "emerald" | "cyan";
  totalLabel?: string; // caption like "Total time spent" or "Total spend"
  ariaLabel?: string;  // accessibility label
};

export default function CompactProgressBar({
  label,
  saved,
  baseline,
  format,
  color = "emerald",
  totalLabel,
  ariaLabel,
}: Props) {
  const total = Math.max(1, baseline);                // avoid 0-div
  const clampedSaved = Math.min(saved, total);        // never exceed baseline
  const pct = Math.min(100, Math.max(0, (clampedSaved / total) * 100));

  const green = color === "emerald" ? "bg-emerald-500" : "bg-cyan-500";
  const greenSoft = color === "emerald"
    ? "bg-emerald-100 dark:bg-emerald-900/20"
    : "bg-cyan-100 dark:bg-cyan-900/20";

  const savedText = format ? format(clampedSaved) : String(clampedSaved);
  const actualSpentWithSLA = Math.max(0, total - clampedSaved);
  const actualSpentWithSLAText = format ? format(actualSpentWithSLA) : String(actualSpentWithSLA);
  const baselineText = format ? format(total) : String(total);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>

      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
        {totalLabel}: <span className="font-medium">{actualSpentWithSLAText}</span>
      </div>

      <div 
        className={`w-full h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 ${greenSoft}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={ariaLabel || `Total ${actualSpentWithSLAText}. Saved ${savedText}. Without SLA ${baselineText}`}
      >
        <div className={`h-full ${green}`} style={{ width: `${pct}%` }} />
        <div className="h-full bg-rose-400/0" style={{ width: `${100 - pct}%` }} aria-hidden />
      </div>

      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-emerald-700 dark:text-emerald-400">Saved: {savedText}</span>
        <span className="text-red-500 dark:text-red-400">Without SLA: {baselineText}</span>
      </div>
    </div>
  );
}
