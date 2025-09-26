import { useSuppliersSummary } from "../hooks/useSuppliersSummary";

export default function SuppliersSnapshotCard({ setActiveDashboardTab }) {
  const { loading, data, error } = useSuppliersSummary(5);
  const goVendors = () => {
    // Navigate to the Saved tab which shows vendors
    if (setActiveDashboardTab) {
      setActiveDashboardTab("Saved");
    }
  }

  return (
    <div
      className="rounded-2xl border shadow-sm overflow-hidden cursor-pointer
                 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
      onClick={goVendors}
      role="button"
      aria-label="Open Vendors"
      tabIndex={0}
      onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') goVendors(); }}
    >
      {/* Green header */}
      <div className="px-4 py-3 bg-emerald-100 text-emerald-950
                      dark:bg-emerald-900/30 dark:text-emerald-200 border-b
                      border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Suppliers</div>
          <div className="text-xs opacity-80">{loading ? "loading…" : `${data.total} total`}</div>
        </div>
      </div>

      {/* Table body */}
      <div className="p-0">
        <table className="w-full text-sm text-slate-900 dark:text-slate-100">
          <thead className="text-left text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-2">Vendor</th>
              <th className="px-2 py-2">City</th>
              <th className="px-2 py-2">Country</th>
              <th className="px-2 py-2 hidden md:table-cell">Category</th>
              <th className="px-4 py-2 text-right hidden sm:table-cell">Updated</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td className="px-4 py-6 text-slate-500 dark:text-slate-400" colSpan={5}>Loading suppliers…</td></tr>
            )}

            {!loading && data.items.length === 0 && !error && (
              <tr><td className="px-4 py-6 text-slate-500 dark:text-slate-400" colSpan={5}>No suppliers found</td></tr>
            )}

            {!loading && error && (
              <tr><td className="px-4 py-6 text-rose-600 dark:text-rose-400" colSpan={5}>Error: {error}</td></tr>
            )}

            {!loading && !error && data.items.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-2">{r.vendor_name}</td>
                <td className="px-2 py-2">{r.city || "—"}</td>
                <td className="px-2 py-2">{r.country_iso2 || "—"}</td>
                <td className="px-2 py-2 hidden md:table-cell">{r.category || "—"}</td>
                <td className="px-4 py-2 text-right hidden sm:table-cell">
                  {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Click to view all suppliers →
      </div>
    </div>
  );
}
