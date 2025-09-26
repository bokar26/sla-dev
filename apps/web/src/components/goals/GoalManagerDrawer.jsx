import React, { useEffect, useMemo, useState } from "react";
import GoalForm from "./GoalForm";
import { goalsApi } from "@/lib/api";
import { emitGoalsChanged } from "./goalsBus";

export default function GoalManagerDrawer({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try { 
        const rows = await goalsApi.list(); 
        if (alive) setItems(rows || []); 
      } catch (e) {
        console.warn("goals list unavailable", e);
        if (alive) setItems([]);
      } finally { 
        if (alive) setLoading(false); 
      }
    })();
    return () => { alive = false; };
  }, [open]);

  async function save(body) {
    setSaving(true);
    try {
      if (editing?.id) {
        const row = await goalsApi.update(editing.id, body);
        setItems((xs) => xs.map((x) => (x.id === row.id ? row : x)));
      } else {
        const row = await goalsApi.create(body);
        setItems((xs) => [row, ...xs]);
      }
      emitGoalsChanged();   // notify pages to re-rank / re-fetch
      setEditing(null);
    } catch (e) {
      console.error("Failed to save goal", e);
      alert("Failed to save goal. Please try again.");
    } finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("Delete this goal?")) return;
    try {
      await goalsApi.remove(id);
      setItems((xs) => xs.filter((x) => x.id !== id));
      emitGoalsChanged();
    } catch (e) {
      console.error("Failed to delete goal", e);
      alert("Failed to delete goal. Please try again.");
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "block" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="
          absolute right-0 top-0 h-full w-[min(96vw,960px)]
          bg-white shadow-2xl border-l flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-semibold">Goal Manager</div>
          <button className="rounded border px-3 py-1.5" onClick={onClose}>Close</button>
        </div>

        {/* Body: full height with two scrollable columns */}
        <div className="flex-1 flex min-h-0">
          {/* Left: list (40%) */}
          <div className="basis-2/5 min-w-[300px] border-r overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Your goals</div>
              <button className="text-sm underline" onClick={() => setEditing({})}>New</button>
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-slate-500">No goals yet. Click <b>New</b> to add one.</div>
            ) : (
              <ul className="space-y-2">
                {items.map(g => (
                  <li key={g.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium leading-5">{g.title}</div>
                        <div className="text-xs text-slate-500">{g.metric}/{g.unit} • {g.direction} • weight {g.weight}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] rounded-full px-2 py-0.5 border ${g.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {g.is_active ? "Active" : "Paused"}
                        </span>
                        <button className="text-xs underline" onClick={() => setEditing(g)}>Edit</button>
                        <button className="text-xs text-rose-600 underline" onClick={() => remove(g.id)}>Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right: editor (60%) */}
          <div className="basis-3/5 overflow-y-auto p-6">
            {editing ? (
              <>
                <div className="text-sm font-medium mb-3">{editing.id ? "Edit goal" : "Create goal"}</div>
                <GoalForm initial={editing.id ? editing : undefined} submitting={saving} onSubmit={save} />
              </>
            ) : (
              <div className="text-sm text-slate-500">Select a goal on the left, or click <b>New</b>.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
