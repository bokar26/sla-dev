import React from "react";

export default function GoalImpactBadge({ impacts = [] }) {
  if (!impacts || impacts.length === 0) return null;
  const best = impacts.reduce((a, b) => ((b.pct_to_goal || 0) > (a.pct_to_goal || 0) ? b : a), impacts[0]);
  const pct = Math.round((best.pct_to_goal || 0) * 100);
  const delta = best.delta;
  const unit = best.unit === "USD" ? "$" : best.unit;
  const sign = best.direction === "decrease" ? "-" : "+";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
      <span>Goal +{pct}%</span>
      <span className="opacity-80">({sign}{unit}{delta})</span>
    </div>
  );
}


