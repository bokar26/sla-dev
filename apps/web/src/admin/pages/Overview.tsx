import KpiCard from "../../components/Admin/KpiCard";
import AdminVendorFactoryCard from "../../components/AdminVendorFactoryCard";
import { useAdminStats } from "../../hooks/useAdminStats";

export default function Overview() {
  const { loading, data, error } = useAdminStats();

  // Placeholder KPIs (replace with real later)
  const kpi = {
    spend: "$—",
    onTime: "—",
    openOrders: "—",
    alerts: "—",
  };

  return (
    <div className="space-y-6">
      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="30-Day Spend" value={kpi.spend} />
        <KpiCard label="Avg On-Time" value={kpi.onTime} />
        <KpiCard label="Open Orders" value={kpi.openOrders} />
        <KpiCard label="Active Alerts" value={kpi.alerts} />
      </div>

      {/* Vendors / Factories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminVendorFactoryCard
          vendors={data?.vendor_count}
          factories={data?.factory_count_total}
          loading={loading}
          error={error || undefined}
        />
        {/* Right-side card placeholder (you can add charts later) */}
        <div className="rounded-2xl border bg-white dark:bg-slate-900/60 shadow-sm p-4 h-full">
          <div className="text-sm opacity-70 text-slate-900 dark:text-slate-100">Overview Notes</div>
          <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">This admin dashboard is scoped and styled independently from the main app.</p>
        </div>
      </div>
    </div>
  );
}
