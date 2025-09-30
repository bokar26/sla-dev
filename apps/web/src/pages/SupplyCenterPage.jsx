// @ts-nocheck
import React, { useLayoutEffect, useRef, useCallback, useMemo } from "react";
import SleekCard from "../components/ui/SleekCard";
import AccentKpiCard from "../components/ui/AccentKpiCard";
import SleekProgressBar from "../components/ui/SleekProgressBar";
import SuppliersSnapshotCard from "../components/SuppliersSnapshotCard";
import SlaSuggestionsCard from "../components/SlaSuggestionsCard";
import ApiStatusBanner from "../components/ApiStatusBanner";
import GoalBar from "@/components/goals/GoalBar";
import GoalProgressCard from "../components/supply-center/GoalProgressCard";
import VendorRegionPieCard from "../components/supply-center/VendorRegionPieCard";
import SLASuggestionsCard from "../components/supply-center/SLASuggestionsCard";
import { Card } from "@/components/ui/card";
import { useSlaSuggestions } from "../hooks/useSlaSuggestions";
import { useSupplyCenterMetrics } from "../hooks/useSupplyCenterMetrics";
import { fmtCurrency, fmtDuration } from "../utils/formatters";

// ===== SLA: START supply center helpers =====
function GoalProgressBar({
  goalLabel,
  current,
  target,
}: { goalLabel: string; current: number; target: number }) {
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Goal</p>
          <h3 className="text-base md:text-lg font-semibold">{goalLabel}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs md:text-sm text-muted-foreground">Target</p>
          <p className="text-sm md:text-base font-medium">+{target}%</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress: +{current}%</span>
          <span>{Math.round(pct)}% of goal</span>
        </div>
      </div>
    </Card>
  );
}

/** Conic-gradient donut (no external charts). */
function VendorRegionDonut({
  title = "Vendor regional breakdown",
  // If API wiring exists later, pass actual data in [{ name, value }] format
  data = [
    { name: "Mainland China", value: 42 },
    { name: "Bangladesh", value: 13 },
    { name: "Türkiye", value: 10 },
    { name: "China (CN)", value: 9 },
    { name: "India", value: 7 },
    { name: "Vietnam", value: 4 },
    { name: "Other", value: 15 },
  ],
}: {
  title?: string;
  data?: { name: string; value: number }[];
}) {
  const palette = [
    "#16a34a", // emerald
    "#0ea5e9", // sky
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ef4444", // red
    "#14b8a6", // teal
    "#64748b", // slate
  ];
  const total = data.reduce((a, b) => a + b.value, 0) || 1;

  // Build conic-gradient stops
  const gradient = useMemo(() => {
    let acc = 0;
    return data
      .map((d, i) => {
        const start = (acc / total) * 360;
        acc += d.value;
        const end = (acc / total) * 360;
        return `${palette[i % palette.length]} ${start}deg ${end}deg`;
      })
      .join(", ");
  }, [data, total]);

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div
          className="relative h-40 w-40 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
          aria-label="Vendor region pie"
        >
          <div className="absolute inset-4 rounded-full bg-background" />
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: palette[i % palette.length] }}
              />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="ml-auto font-medium">
                {Math.round((d.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function SLASuggestionsCard() {
  const tips = [
    {
      title: "Shift CN→EU lanes with ≥10d slack from sea to rail",
      impact: 4,
      note: "Applies to ~27% of current CN→EU orders with margin to spare.",
    },
    {
      title: "Consolidate Vietnam suppliers into 2 primary hubs",
      impact: 3,
      note: "Cuts handoffs and improves pickup windows.",
    },
    {
      title: "Enable pre-booked air for urgent SKUs in Q4",
      impact: 2,
      note: "Lock capacity for spikes; restrict to top 10 SKUs.",
    },
  ];

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold mb-3">SLA suggestions</h3>
      <ul className="space-y-3">
        {tips.map((t) => (
          <li key={t.title} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.note}</p>
            </div>
            <span className="shrink-0 rounded-md bg-emerald-600/10 text-emerald-700 px-2 py-1 text-xs font-medium">
              +{t.impact}% toward Q4 goal
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
// ===== SLA: END supply center helpers =====

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
    const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/,"");
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
            
            {/* ===== SLA: START goal card ===== */}
            <div className="mt-4">
              <GoalProgressBar
                goalLabel="Increase Q4 shipping speed by 18%"
                current={6}   // ~1/3 progress toward 18%
                target={18}
              />
            </div>
            {/* ===== SLA: END goal card ===== */}
            
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

            {/* ===== SLA: START analytics row ===== */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VendorRegionDonut />
              <SLASuggestionsCard />
            </div>
            {/* ===== SLA: END analytics row ===== */}

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

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                {/* Vendor Regional Breakdown Pie Chart */}
                <VendorRegionPieCard />

                {/* SLA Suggestions */}
                <SLASuggestionsCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}