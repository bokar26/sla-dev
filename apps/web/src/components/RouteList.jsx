export default function RouteList({ data }) {
  if (!data) return null;
  const { routes = [], top_index = -1 } = data;
  if (routes.length === 0) return <div className="mt-3 text-sm opacity-70">No routes found.</div>;

  return (
    <div className="mt-4 space-y-3">
      {routes.map((r, idx) => {
        const isTop = idx === top_index || r.top;
        return (
          <div key={`${r.lane_id}-${idx}`} className={`rounded-2xl p-4 border ${isTop ? "ring-2 ring-emerald-500 bg-emerald-50" : "bg-white"}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {isTop && <span className="text-xs px-2 py-0.5 rounded-full border mr-2">Top Match</span>}
                {r.mode.toUpperCase()} • Lane <b>{r.lane_id}</b>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">Score {r.score.toFixed(3)}</div>
                <div className="text-xs opacity-70">On-time {Math.round(r.on_time_rate*100)}%</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div><span className="opacity-70">ETA</span> {Math.round(r.eta_days)} days</div>
              <div><span className="opacity-70">Freight</span> ${r.freight_usd.toFixed(2)}</div>
              <div><span className="opacity-70">Duties/Taxes</span> ${r.duties_taxes_usd.toFixed(2)}</div>
              <div><span className="opacity-70">Landed</span> ${r.landed_total_usd.toFixed(2)}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 border rounded-xl text-sm">Book</button>
              <button className="px-3 py-1 border rounded-xl text-sm">Compare</button>
              <button className="px-3 py-1 border rounded-xl text-sm">Export</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
