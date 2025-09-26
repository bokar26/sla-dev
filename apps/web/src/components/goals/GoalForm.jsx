// JS-only, minimal validation. Reused in drawer + settings page.
import React, { useMemo, useState } from "react";

export default function GoalForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => ({
    title: "",
    category: "supply_center",
    metric: "cost",             // "cost" | "time" | "custom"
    unit: "USD",                // "USD" | "days" | "custom"
    direction: "decrease",      // "decrease" | "increase"
    target_amount: "",
    baseline_amount: "",
    weight: 0.3,
    is_active: true,
    ...(initial || {}),
  }));

  const isValid = useMemo(() => {
    const ta = Number(form.target_amount);
    return form.title.trim().length >= 3 && !Number.isNaN(ta) && ta > 0;
  }, [form]);

  function set(k, v) { setForm((s) => ({ ...s, [k]: v })); }

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => { e.preventDefault(); if (isValid) onSubmit(form); }}
    >
      <div>
        <label className="text-sm font-medium">Goal name</label>
        <input className="mt-1 w-full rounded-md border px-3 py-2"
               value={form.title} onChange={(e)=>set("title", e.target.value)}
               placeholder="Reduce monthly inventory expenditure by $20,000" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Metric</label>
          <select className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.metric} onChange={(e)=>set("metric", e.target.value)}>
            <option value="cost">Cost</option>
            <option value="time">Time</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Unit</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2"
                 value={form.unit} onChange={(e)=>set("unit", e.target.value)} placeholder="USD / days / …"/>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Direction</label>
          <select className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.direction} onChange={(e)=>set("direction", e.target.value)}>
            <option value="decrease">Decrease</option>
            <option value="increase">Increase</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <select className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.category} onChange={(e)=>set("category", e.target.value)}>
            <option value="supply_center">Supply Center</option>
            <option value="sourcing">Sourcing</option>
            <option value="fulfillment">Fulfillment</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Target amount</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2"
                 type="number" step="any"
                 value={form.target_amount} onChange={(e)=>set("target_amount", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Baseline (optional)</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2"
                 type="number" step="any"
                 value={form.baseline_amount ?? ""} onChange={(e)=>set("baseline_amount", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Ranking weight (0–1)</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" min="0" max="1" step="0.05"
                 value={form.weight} onChange={(e)=>set("weight", Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!form.is_active} onChange={(e)=>set("is_active", e.target.checked)} />
            <span className="text-sm">Active</span>
          </label>
        </div>
      </div>

      <div className="mt-1 flex gap-2">
        <button type="submit" disabled={!isValid || submitting}
                className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-60">
          {submitting ? "Saving…" : "Save goal"}
        </button>
      </div>
    </form>
  );
}
