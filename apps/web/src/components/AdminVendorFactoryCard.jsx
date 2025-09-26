export default function AdminVendorFactoryCard({ vendors = 0, factories = 0, loading = false, error }) {
  const val = (n) => (loading ? "—" : (Number.isFinite(n) ? n : 0));

  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900/60 shadow-sm">
      <div className="text-sm opacity-70 text-slate-900 dark:text-slate-100">Supply Base</div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs opacity-60 text-slate-600 dark:text-slate-400">Unique Vendors</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{val(vendors)}</div>
        </div>
        <div>
          <div className="text-xs opacity-60 text-slate-600 dark:text-slate-400">Total Factories</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{val(factories)}</div>
        </div>
      </div>
      {error && <div className="text-xs text-amber-700 dark:text-amber-400 mt-2">Stats error: {error}</div>}
      <div className="text-[11px] opacity-50 mt-1 text-slate-600 dark:text-slate-400">Counts reflect latest ingest across all sheets</div>
    </div>
  );
}
