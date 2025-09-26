export default function SupplyKPICards({ kpis }) {
  const Card = ({ title, value, sub }) => (
    <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900/60 shadow-sm">
      <div className="text-sm opacity-70 text-slate-900 dark:text-slate-100">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-1 text-slate-600 dark:text-slate-400">{sub}</div>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card title="Active Suppliers" value={kpis.suppliers ?? "—"} sub={kpis.suppliersSub} />
      <Card title="Open Orders" value={kpis.openOrders ?? "—"} sub={kpis.openOrdersSub} />
      <Card title="Avg On-Time" value={kpis.onTime ?? "—"} sub={kpis.onTimeSub} />
      <Card title="30-Day Spend" value={kpis.spend ?? "—"} sub={kpis.spendSub} />
    </div>
  );
}
