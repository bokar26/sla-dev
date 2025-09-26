import React, { useEffect, useState } from "react";
import { goalsApi } from "@/lib/api";
import GoalForm from "@/components/goals/GoalForm";
import { emitGoalsChanged } from "@/components/goals/goalsBus";

export default function SettingsGoalsPage() {
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() { 
    try {
      setRows(await goalsApi.list()); 
    } catch (e) {
      console.warn("goals list unavailable", e);
      setRows([]);
    }
  }

  useEffect(() => { (async ()=>{ await load(); setLoading(false); })(); }, []);

  async function save(form) {
    setSaving(true);
    try {
      if (sel?.id) {
        const r = await goalsApi.update(sel.id, form);
        setRows((xs)=>xs.map(x=>x.id===r.id?r:x));
      } else {
        const r = await goalsApi.create(form);
        setRows((xs)=>[r, ...xs]);
      }
      emitGoalsChanged();
      setSel(null);
    } catch (e) {
      console.error("Failed to save goal", e);
      alert("Failed to save goal. Please try again.");
    } finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("Delete goal?")) return;
    try {
      await goalsApi.remove(id);
      emitGoalsChanged();
      await load();
    } catch (e) {
      console.error("Failed to delete goal", e);
      alert("Failed to delete goal. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Goals</h1>
      <p className="text-slate-600 mt-1">Create targets that guide sourcing and fulfillment ranking.</p>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Your goals</div>
            <button className="text-sm underline" onClick={()=>setSel({})}>New</button>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm divide-y">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No goals yet.</div>
            ) : rows.map((g)=>(
              <div key={g.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-slate-500">{g.metric}/{g.unit} • {g.direction} • weight {g.weight}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] rounded-full px-2 py-0.5 border ${g.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {g.is_active ? "Active" : "Paused"}
                  </span>
                  <button className="text-xs underline" onClick={()=>setSel(g)}>Edit</button>
                  <button className="text-xs text-rose-600 underline" onClick={()=>remove(g.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="text-sm font-medium mb-2">{sel?.id ? "Edit goal" : "New goal"}</div>
            {sel ? (
              <GoalForm initial={sel.id ? sel : undefined} submitting={saving} onSubmit={save} />
            ) : (
              <div className="text-sm text-slate-500">Select a goal to edit, or click <b>New</b>.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
