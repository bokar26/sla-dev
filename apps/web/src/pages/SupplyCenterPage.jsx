// @ts-nocheck
import React, { useLayoutEffect, useRef, useCallback } from "react";
import SleekCard from "../components/ui/SleekCard";
import AccentKpiCard from "../components/ui/AccentKpiCard";
import SleekProgressBar from "../components/ui/SleekProgressBar";
import SuppliersSnapshotCard from "../components/SuppliersSnapshotCard";
import SlaSuggestionsCard from "../components/SlaSuggestionsCard";
import ApiStatusBanner from "../components/ApiStatusBanner";
import GoalBar from "@/components/goals/GoalBar";
import { useSlaSuggestions } from "../hooks/useSlaSuggestions";
import { useSupplyCenterMetrics } from "../hooks/useSupplyCenterMetrics";
import { fmtCurrency, fmtDuration } from "../utils/formatters";

/**
 * Local helper: set the container's height to fill viewport from its top,
 * so it becomes a reliable scroll area below the global header.
 */
function useFillDownFromTop() {
  const ref = useRef(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    const safeBottom =
      parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-inset-bottom") || "0",
        10
      ) || 0;
    const h = Math.max(0, window.innerHeight - top - safeBottom);
    el.style.height = `${h}px`;
  }, []);

  useLayoutEffect(() => {
    const onResize = () => measure();
    // initial + post-layout
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

export default function SupplyCenterPage({ setActiveDashboardTab }) {
  const scrollRef = useFillDownFromTop();
  
  // Suggestions
  const { loading: suggLoading, data: suggData, error: suggError, reload: suggReload, act: suggAct } = useSlaSuggestions();
  const onSuggestionAction = async (id, action) => {
    const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
    if (action === "run") {
      await fetch(`${base}/ai/suggestions/run`, { method: "POST" });
      await suggReload();
      return;
    }
    await suggAct(id, action);
  };

  // Supply center metrics
  const { loading: mLoading, data: m } = useSupplyCenterMetrics();

  return (
    <section className="flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* ==== PAGE HEADER / FILTERS / KPIs (NON-SCROLLING; STICKY INSIDE PANE) ==== */}
      <div
        className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50"
      >
        {/* Page header */}
        <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">Supply Center</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your unified view for suppliers, fulfillment, and insights.</p>
          </div>
        </div>
      </div>

      {/* ==== SCROLLABLE CONTENT AREA (ONLY THIS PANE SCROLLS) ==== */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overscroll-contain scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Supply Center content"
      >
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-4 py-6 pb-12 space-y-6">
            {/* Goals Bar - left-aligned in content */}
            <GoalBar />
            
            {/* API Connection Status Banner */}
            <ApiStatusBanner />
            
            {/* PROGRESS BARS */}
            <div className="space-y-3 mb-4">
              <SleekProgressBar
                label="time saved sourcing with SLA data driven optimizations"
                saved={m?.time_saved_minutes ?? 0}
                baseline={m?.time_baseline_minutes ?? 1}
                format={fmtDuration}
                color="emerald"
                totalLabel="Total time spent"
              />
              <SleekProgressBar
                label="cost savings with SLA data driven insights"
                saved={m?.cost_saved_cents ?? 0}
                baseline={m?.cost_baseline_cents ?? 1}
                format={fmtCurrency}
                color="emerald"
                totalLabel="Total spend"
              />
            </div>
            
            {/* TOP: Accent KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AccentKpiCard
                label="Total Revenue"
                value={fmtCurrency(m?.total_revenue_cents)}
                sub="last 30 days"
                loading={mLoading}
              />
              <AccentKpiCard
                label="Commission"
                value={fmtCurrency(m?.commission_cents)}
                sub="last 30 days"
                loading={mLoading}
              />
              <AccentKpiCard
                label="Open Orders"
                value={m?.open_orders ?? "—"}
                sub="live"
                loading={mLoading}
              />
              <AccentKpiCard
                label="Time Saved"
                value={fmtDuration(m?.time_saved_minutes)}
                sub="30-day total"
                loading={mLoading}
              />
            </div>

            {/* MAIN GRID: left = suppliers + suggestions, right = future widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-min">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* Suppliers snapshot (single card) */}
                <SuppliersSnapshotCard setActiveDashboardTab={setActiveDashboardTab} />

                {/* SLA Suggestions directly below; keep as-is */}
                <SleekCard>
                  <div id="sla-suggestions-card" className="p-4">
                    <SlaSuggestionsCard data={suggData} onAction={onSuggestionAction} />
                    {suggLoading && <div className="mt-2 text-sm opacity-70 text-slate-600 dark:text-slate-400">Analyzing trends…</div>}
                    {suggError && (
                      <div className="mt-2 text-xs text-amber-700 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded p-2">
                        {suggError}
                      </div>
                    )}
                  </div>
                </SleekCard>
              </div>

              {/* RIGHT COLUMN (future content) */}
              <div className="space-y-6">
                <SleekCard>
                  <div className="p-4">
                    <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Fulfillment Snapshot</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Add routes, lead times, and cost tiles here.</div>
                  </div>
                </SleekCard>

                <SleekCard>
                  <div className="p-4">
                    <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Quality & Issues</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Coming soon.</div>
                  </div>
                </SleekCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}