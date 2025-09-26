import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import GoalManagerDrawer from "./GoalManagerDrawer";
import { onGoalsChanged } from "./goalsBus";

export default function GoalBar() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const rows = await apiFetch('goals/progress');
      setGoals(rows || []);
    } catch (e) {
      console.warn("goals/progress unavailable", e);
      setGoals([]);           // render bar without data
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => { try { await load(); } finally { if (alive) setLoading(false); } })();
    return () => { alive = false; };
  }, []);

  useEffect(() => onGoalsChanged(() => load()), []); // live refresh

  if (loading) return null;

  return (
    <div className="my-4">
      <div className="w-full rounded-2xl border bg-white shadow-sm px-4 py-3">
        {/* Header row: title left, Manage right */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Goals</span>
          <button className="text-sm underline" onClick={() => setOpen(true)}>Manage</button>
        </div>

        {/* Chips: left-aligned under header */}
        <div className="mt-2 flex flex-wrap gap-2">
          {goals.length === 0 ? (
            <span className="text-xs text-slate-500">No active goals yet.</span>
          ) : goals.map(({ goal, percent_complete }) => (
            <div key={goal.id} className="flex items-center gap-2 rounded-lg border px-2 py-1">
              <span className="text-xs font-medium">{goal.title}</span>
              <div className="h-2 w-28 rounded bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round((percent_complete||0)*100)}%` }} />
              </div>
              <span className="text-xs text-slate-600">{Math.round((percent_complete||0)*100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keep the nice wide/full-height drawer */}
      <GoalManagerDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}


