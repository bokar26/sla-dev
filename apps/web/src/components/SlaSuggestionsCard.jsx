export default function SlaSuggestionsCard({ data, onAction }) {
  const items = data?.suggestions || [];
  const top = items[0];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">SLA Suggestions</h3>
        <button className="text-sm px-3 py-1 border rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={()=>onAction(null, "run")}>Refresh</button>
      </div>

      {items.length === 0 ? (
        <div className="mt-2 text-sm opacity-70 text-slate-600 dark:text-slate-400">No new suggestions right now.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((s, idx) => {
            const isTop = idx === 0;
            return (
              <div key={s.id} className={`rounded-xl p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 ${isTop ? "ring-2 ring-indigo-400 dark:ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {isTop && <span className="text-xs px-2 py-0.5 border rounded-full mr-2 border-indigo-300 dark:border-indigo-600 bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300">Top Pick</span>}
                    {s.title}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Impact {(s.impact_score*100).toFixed(0)}%</div>
                    {s.expected_savings_usd > 0 && <div className="opacity-70 text-slate-600 dark:text-slate-400">~${s.expected_savings_usd.toFixed(0)} saved</div>}
                  </div>
                </div>
                <div className="mt-1 text-sm opacity-80 text-slate-600 dark:text-slate-400">{s.description}</div>
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 border rounded-xl text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={()=>onAction(s.id, "accept")}>Apply</button>
                  <button className="px-3 py-1 border rounded-xl text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={()=>onAction(s.id, "snooze")}>Snooze</button>
                  <button className="px-3 py-1 border rounded-xl text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={()=>onAction(s.id, "dismiss")}>Dismiss</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
