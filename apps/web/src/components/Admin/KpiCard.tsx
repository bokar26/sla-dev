type Props = { label: string; value?: string | number; delta?: string; loading?: boolean };
export default function KpiCard({ label, value, delta, loading }: Props) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900/60 shadow-sm p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">{loading ? "—" : (value ?? "—")}</div>
      {delta && <div className="text-xs mt-1 text-emerald-600 dark:text-emerald-400">{delta}</div>}
    </div>
  );
}
