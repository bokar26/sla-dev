import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ContentContainer from "../../components/layout/ContentContainer";
import { useDashboardPrefs } from "../../hooks/useDashboardPrefs";
import { getSupplyCenterMetrics } from "../../services/metricsService";

// TODO: Revert to live API values after the demo.
// Replaced demo/mock with real API call: see services/serviceMap.md

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtHours = (h) => `${Math.max(0, Math.round(h))}h`;

// ===== SLA: START supply center helpers (safe, file-local) =====
const CardOrDiv = (props) => {
  // Prefer project Card if present; else fall back to a styled div
  try {
    // @ts-ignore
    const { Card } = require("@/components/ui/card");
    return <Card {...props} />;
  } catch {
    return <div className="rounded-xl border bg-background p-4 md:p-6" {...props} />;
  }
};

function GoalProgressBar({
  goalLabel,
  current,
  target,
}) {
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  return (
    <CardOrDiv>
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
          <div className="h-2 rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress: +{current}%</span>
          <span>{Math.round(pct)}% of goal</span>
        </div>
      </div>
    </CardOrDiv>
  );
}

function VendorRegionDonut({
  title = "Vendor regional breakdown",
  data = [
    { name: "Mainland China", value: 42 },
    { name: "Bangladesh", value: 13 },
    { name: "Türkiye", value: 10 },
    { name: "China (CN)", value: 9 },
    { name: "India", value: 7 },
    { name: "Vietnam", value: 4 },
    { name: "Other", value: 15 },
  ],
}) {
  const palette = ["#16a34a","#0ea5e9","#f59e0b","#8b5cf6","#ef4444","#14b8a6","#64748b"];
  const total = Math.max(1, data.reduce((a,b)=>a+b.value,0));
  let acc = 0;
  const gradient = data.map((d,i)=> {
    const start = (acc/total)*360; acc+=d.value;
    const end = (acc/total)*360;
    return `${palette[i%palette.length]} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <CardOrDiv>
      <h3 className="text-base md:text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative h-40 w-40 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-4 rounded-full bg-background" />
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {data.map((d,i)=>(
            <li key={d.name} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: palette[i%palette.length] }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="ml-auto font-medium">{Math.round((d.value/total)*100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </CardOrDiv>
  );
}

function SLASuggestionsCard() {
  const tips = [
    { title: "Shift CN→EU lanes with ≥10d slack from sea to rail", impact: 4, note: "Applies to ~27% of CN→EU orders." },
    { title: "Consolidate Vietnam suppliers into 2 primary hubs",     impact: 3, note: "Cuts handoffs; improves pickup windows." },
    { title: "Enable pre-booked air for urgent SKUs in Q4",           impact: 2, note: "Lock capacity; restrict to top SKUs." },
  ];
  return (
    <CardOrDiv>
      <h3 className="text-base md:text-lg font-semibold mb-3">SLA suggestions</h3>
      <ul className="space-y-3">
        {tips.map(t=>(
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
    </CardOrDiv>
  );
}
// ===== SLA: END supply center helpers =====

const suppliers = [
  { vendor: "Alpha Co", city: "Tiruppur", country: "IN", category: "—", updated: "9/22/2025" },
  { vendor: "Beta Ltd", city: "Tiruppur", country: "IN", category: "—", updated: "9/22/2025" },
  { vendor: "Delta Corp", city: "Bangkok", country: "TH", category: "—", updated: "9/22/2025" },
  { vendor: "Echo Ltd", city: "Bangkok", country: "TH", category: "—", updated: "9/22/2025" },
];

export default function SupplyCenterPage() {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const { hiddenCards, isHidden, toggleCard } = useDashboardPrefs('supplyCenter');
  
  // Real metrics from API
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await getSupplyCenterMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);
  
  // Compute percentages from real API data
  const timePct = metrics && metrics.total_without_sla?.value > 0 
    ? Math.min(1, metrics.time_saved?.value / metrics.total_without_sla?.value) 
    : 0;
  const costPct = metrics && metrics.total_without_sla?.value > 0 
    ? Math.min(1, metrics.cost_saved?.value / metrics.total_without_sla?.value) 
    : 0;

  // Card definitions with navigation mapping
  const kpiCards = [
    { 
      id: 'totalRevenue', 
      label: "TOTAL REVENUE", 
      value: "$265,000.00", 
      sub: "last 30 days",
      route: "/app/finances" // Maps to existing finances route
    },
    { 
      id: 'commission', 
      label: "COMMISSION", 
      value: "$68,375.00", 
      sub: "last 30 days",
      route: "/app/finances" // Maps to existing finances route
    },
    { 
      id: 'openOrders', 
      label: "OPEN ORDERS", 
      value: "4", 
      sub: "live",
      route: "/app/orders" // Maps to existing orders route
    },
    { 
      id: 'timeSaved', 
      label: "TIME SAVED", 
      value: "12h", 
      sub: "30-day total",
      route: "/app/fulfillment" // Maps to existing fulfillment route
    },
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleCardKeyDown = (e, route) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(route);
    }
  };

  return (
    <ContentContainer>
      {/* Page Title */}
      <header className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Supply Center</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Your unified view for suppliers, fulfillment, and insights.
            </p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-haspopup="dialog"
          >
            Edit dashboard
          </button>
        </div>
      </header>

      {/* SLA: Goal bar */}
      <div className="mt-4">
        <GoalProgressBar goalLabel="Increase Q4 shipping speed by 18%" current={6} target={18} />
      </div>

      {/* Add spacing under Goal */}
      <div className="mt-6" />

      {/* New responsive grid for the two savings bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Saved card */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              TIME SAVED SOURCING WITH SLA DATA DRIVEN OPTIMIZATIONS
            </span>
            <span>
              Total time spent: <b>{loading ? 'Loading...' : fmtHours(metrics?.total_with_sla?.value || 0)}</b>{" "}
              <span className="text-red-500 ml-2">Without SLA: <b>{loading ? 'Loading...' : fmtHours(metrics?.total_without_sla?.value || 0)}</b></span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${timePct * 100}%` }} />
          </div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Saved: {loading ? 'Loading...' : fmtHours(metrics?.time_saved?.value || 0)}
          </div>
        </div>

        {/* Cost Savings card */}
        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              COST SAVINGS WITH SLA DATA DRIVEN INSIGHTS
            </span>
            <span className="text-red-500">
              Without SLA: <b>{loading ? 'Loading...' : fmtCurrency(metrics?.total_without_sla?.value || 0)}</b>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${costPct * 100}%` }} />
          </div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Saved: {loading ? 'Loading...' : fmtCurrency(metrics?.cost_saved?.value || 0)}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          if (isHidden(kpi.id)) return null;
          
          return (
            <div 
              key={kpi.id}
              data-card-id={kpi.id}
              onClick={() => handleCardClick(kpi.route)}
              onKeyDown={(e) => handleCardKeyDown(e, kpi.route)}
              className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-sm transition-colors cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              role="button"
              tabIndex={0}
              aria-label={`Open ${kpi.label.toLowerCase()}`}
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{kpi.value}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{kpi.sub}</div>
            </div>
          );
        })}
      </section>

      {/* SLA: analytics row */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VendorRegionDonut />
        <SLASuggestionsCard />
      </div>

      {/* Suppliers + Snapshot */}
      <section className="mt-6 sm:mt-8 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-0 shadow-sm transition-colors">
          <div className="p-5 border-b dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Suppliers</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">7567 total</p>
          </div>

          {/* Table wrapper for safe overflow */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Vendor</th>
                  <th className="px-5 py-3 text-left font-medium">City</th>
                  <th className="px-5 py-3 text-left font-medium">Country</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {suppliers.map((s, i) => (
                  <tr key={s.vendor + i} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-5 py-3 text-slate-900 dark:text-slate-100">{s.vendor}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{s.city}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{s.country}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{s.category}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Fulfillment Snapshot</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add routes, lead times, and cost tiles here.
          </p>
          <button className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
            Add Route
          </button>
        </div>
      </section>

      {/* Edit Dashboard Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onClick={() => setShowEditModal(false)}>
          <div className="mx-auto my-auto w-[480px] max-w-[95vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Edit Dashboard</div>
              </div>
              <button 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" 
                onClick={() => setShowEditModal(false)} 
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Choose which cards to show or hide on your Supply Center dashboard.
              </div>

              <div className="space-y-3">
                {kpiCards.map((card) => (
                  <label key={card.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!isHidden(card.id)}
                      onChange={() => toggleCard(card.id)}
                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{card.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{card.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}