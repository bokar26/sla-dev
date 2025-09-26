// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { adminAlgo, debugRoutes, api } from "../../lib/api";
import { Download, Copy, X } from "lucide-react";

const COLS = [
  { key: "created_at", label: "Date/Time" },
  { key: "request_type", label: "Request Type" },
  { key: "top_match_score", label: "Highest match %" },
  { key: "user_id", label: "User ID" },
];

function formatDt(s) { 
  try { 
    return new Date(s).toLocaleString(); 
  } catch { 
    return s; 
  } 
}

function pct(x) { 
  if (x == null) return "—"; 
  const v = x > 1 ? x : x * 100; 
  return `${Math.round(v)}%`; 
}

function Row({ row, onClick }) {
  return (
    <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => onClick(row)}>
      <td className="py-2 px-3 whitespace-nowrap">{formatDt(row.created_at)}</td>
      <td className="py-2 px-3 capitalize">{row.request_type}</td>
      <td className="py-2 px-3">{pct(row.top_match_score)}</td>
      <td className="py-2 px-3 font-mono text-xs">{row.user_id}</td>
    </tr>
  );
}

function JsonBlock({ label, value }) {
  const text = useMemo(() => JSON.stringify(value ?? {}, null, 2), [value]);
  
  const download = () => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `${label.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click(); 
    URL.revokeObjectURL(url);
  };
  
  const copy = async () => { 
    try { 
      await navigator.clipboard.writeText(text); 
    } catch (e) {
      console.warn("Failed to copy to clipboard:", e);
    } 
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{label}</h4>
        <div className="flex gap-2">
          <button 
            className="text-sm px-2 py-1 border rounded flex items-center gap-1 hover:bg-muted/50" 
            onClick={copy}
          >
            <Copy size={14}/>Copy
          </button>
          <button 
            className="text-sm px-2 py-1 border rounded flex items-center gap-1 hover:bg-muted/50" 
            onClick={download}
          >
            <Download size={14}/>Download
          </button>
        </div>
      </div>
      <pre className="text-xs bg-muted/40 rounded p-3 overflow-auto max-h-[40vh] border">
        {text}
      </pre>
    </div>
  );
}

function TopMatches({ items }) {
  if (!items?.length) return null;
  
  return (
    <div>
      <h4 className="font-semibold mb-2">Top matches</h4>
      <div className="space-y-2">
        {items.slice(0, 5).map((m, i) => {
          const value = (m?.score ?? 0) * (m?.score > 1 ? 1 : 100);
          const name = m?.name || m?.id || `Match ${i+1}`;
          const percent = pct(m?.score);
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-sm">
                <div className="truncate max-w-[70%]">{i+1}. {name}</div>
                <div className="font-medium">{percent}</div>
              </div>
              <div className="h-2 rounded bg-muted/40">
                <div className="h-2 rounded bg-emerald-500" style={{ width: percent }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OutputsReasoning() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);

  async function load() {
    setLoading(true); 
    setError(null);
    try {
      const data = await adminAlgo.list({ page, page_size: pageSize });
      setRows(data.items ?? []); 
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e?.message || "Failed to load"); 
      setRows([]);
      // Try to get debug routes info
      try { 
        setDebug(await debugRoutes()); 
      } catch { 
        // ignore debug failure
      }
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line
  }, [page, pageSize]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="flex flex-col min-h-0">
      <header className="mb-3">
        <h2 className="text-xl font-semibold">Outputs/Reasoning</h2>
        <p className="text-sm opacity-70">Algorithm outputs with reasoning for Search, Quote, and Logistics</p>
      </header>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {COLS.map(c => (
                <th key={c.key} className="text-left py-2 px-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="py-6 px-3 opacity-70" colSpan={COLS.length}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="py-6 px-3 opacity-70" colSpan={COLS.length}>
                  No data
                </td>
              </tr>
            )}
            {!loading && rows.map(r => (
              <Row key={r.id} row={r} onClick={setSel} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs opacity-70">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button 
            className="border rounded px-2 py-1 text-sm disabled:opacity-50" 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>
          <div className="text-sm">{page}/{pages}</div>
          <button 
            className="border rounded px-2 py-1 text-sm disabled:opacity-50" 
            disabled={page >= pages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Details drawer */}
      {sel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSel(null)} />
          <div className="absolute right-0 top-0 h-full w-[720px] max-w-[90vw] bg-background border-l shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm opacity-70">{formatDt(sel.created_at)}</div>
                <div className="font-semibold capitalize">{sel.request_type}</div>
              </div>
              <button 
                className="border rounded px-2 py-1 flex items-center gap-1 hover:bg-muted/50" 
                onClick={() => setSel(null)}
              >
                <X size={16}/> Close
              </button>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs opacity-70">User ID</div>
                  <div className="font-mono text-xs">{sel.user_id}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Highest match %</div>
                  <div>{pct(sel.top_match_score)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Total matches</div>
                  <div>{sel.total_matches ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Latency</div>
                  <div>{sel.latency_ms ? `${sel.latency_ms} ms` : "—"}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Model</div>
                  <div>{sel.model || "—"} {sel.model_version || ""}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Status</div>
                  <div>{sel.status || "—"}</div>
                </div>
              </div>

              <TopMatches items={sel.top_matches} />

              {sel.output_summary && (
                <div>
                  <h4 className="font-semibold mb-1">Summary</h4>
                  <p className="text-sm">{sel.output_summary}</p>
                </div>
              )}

              <JsonBlock label="Input Payload" value={sel.input_payload} />
              <JsonBlock label="Reasoning (Full Trail)" value={sel.reasoning} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
          <div className="mt-1 text-xs opacity-70">
            BASE: <code>{api.base}</code> • PREFIX: <code>{api.prefix}</code> • Path: <code>admin/algo-outputs</code>
          </div>
          {debug && (
            <details className="mt-2">
              <summary className="cursor-pointer">Mounted backend routes</summary>
              <pre className="text-xs bg-muted/40 rounded p-3 overflow-auto max-h-[40vh]">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}