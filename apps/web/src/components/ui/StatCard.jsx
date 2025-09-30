export function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}