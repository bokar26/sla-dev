import React from "react";

const Badge = ({ children }) => (
  <span className="text-xs px-2 py-0.5 rounded-full border">{children}</span>
);

export default function SlaResultsList({ data }) {
  if (!data) return null;
  const { results = [], top_index = -1, sku_spec, enriched } = data;
  if (results.length === 0)
    return <div className="mt-4 text-sm opacity-70">No matches yet. Try adjusting your query.</div>;

  return (
    <div className="mt-4 space-y-3">
      {results.map((r, idx) => {
        const isTop = idx === top_index;
        return (
          <div
            key={`${r.factory_id}-${r.lane_id}-${idx}`}
            className={`rounded-2xl p-4 border ${isTop ? "ring-2 ring-blue-400 bg-blue-50" : "bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {isTop && <Badge>Top Match</Badge>}{" "}
                Factory <b>{r.factory_id}</b> • Lane <b>{r.lane_id}</b>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">Score {r.total.toFixed(3)}</div>
                <div className="text-xs opacity-70">Match {Math.round(r.match*100)}%</div>
              </div>
            </div>
            <div className="mt-2 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><span className="opacity-70">ETA</span> {r.transit_days} days</div>
              <div><span className="opacity-70">On-time</span> {Math.round(r.on_time*100)}%</div>
              <div><span className="opacity-70">FOB</span> ${r.fob.toFixed(2)}</div>
              <div><span className="opacity-70">Est. Cost</span> ${r.cost.toFixed(2)}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 border rounded-xl text-sm">View Details</button>
              <button className="px-3 py-1 border rounded-xl text-sm">Compare</button>
              <button className="px-3 py-1 border rounded-xl text-sm">Start Quote</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
