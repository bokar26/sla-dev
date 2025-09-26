import { useState, useMemo } from "react";
import { useSavedQuotes } from "../hooks/useSavedQuotes";

export default function FulfillmentPage() {
  const { loading: quotesLoading, data: quotes, error: quotesError } = useSavedQuotes(100);

  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const selectedQuote = useMemo(
    () => quotes.find(q => q.id === selectedQuoteId),
    [quotes, selectedQuoteId]
  );

  const origin = useMemo(() => ({
    city: selectedQuote?.origin_city,
    country: selectedQuote?.origin_country_iso2,
    port: selectedQuote?.origin_port_code
  }), [selectedQuote]);

  const [destCity, setDestCity] = useState("");
  const [destCountry, setDestCountry] = useState("");
  const [destPort, setDestPort] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const canPlan = Boolean((origin.city || origin.port || origin.country) && (destCity || destPort || destCountry));

  const planRoute = async () => {
    if (!canPlan) return;
    
    setRouteLoading(true);
    setRouteError(null);
    
    try {
      const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
      const payload = {
        origin: { 
          city: origin.city, 
          country: origin.country, 
          port: origin.port 
        },
        destination: { 
          city: destCity || undefined, 
          country: destCountry || undefined, 
          port: destPort || undefined 
        },
        quote_id: selectedQuote?.id
      };
      
      const res = await fetch(`${base}/logistics/plan`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setRouteData(data);
    } catch (e) {
      setRouteError(e.message || "Failed to plan route");
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Fulfillment</h1>

      {/* Select Quote (from Saved) */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900/60 shadow-sm p-4">
        <label className="block text-sm font-medium mb-1">Select Quote</label>
        <select
          value={selectedQuoteId}
          onChange={(e)=>setSelectedQuoteId(e.target.value)}
          className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 text-sm"
        >
          <option value="" disabled>{quotesLoading ? "Loading quotes…" : "Choose a saved quote"}</option>
          {quotes.map(q => (
            <option key={q.id} value={q.id}>
              {q.ref} — {q.vendor_name ?? "Vendor"} ({q.origin_city ?? q.origin_port_code ?? q.origin_country_iso2 ?? "origin unknown"})
            </option>
          ))}
        </select>

        {/* origin note in small red text */}
        {selectedQuote && (
          <p className="mt-1 text-xs text-rose-600">
            Origin: {origin.city ? `${origin.city}, ` : ""}{origin.country ?? ""}{origin.port ? ` • Port: ${origin.port}` : ""}
          </p>
        )}

        {quotesError && <p className="mt-2 text-xs text-rose-600">Error loading quotes: {quotesError}</p>}
      </div>

      {/* Destination inputs */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900/60 shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Destination City</label>
          <input
            value={destCity}
            onChange={(e)=>setDestCity(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 text-sm"
            placeholder="e.g., Los Angeles"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination Country</label>
          <input
            value={destCountry}
            onChange={(e)=>setDestCountry(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 text-sm"
            placeholder="e.g., US"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination Port (optional)</label>
          <input
            value={destPort}
            onChange={(e)=>setDestPort(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 text-sm"
            placeholder="e.g., USLAX"
          />
        </div>
      </div>

      {/* Plan Route */}
      <div className="flex gap-3">
        <button
          disabled={!canPlan || routeLoading}
          onClick={planRoute}
          className={`h-11 px-5 rounded-full text-white text-sm font-semibold transition
            ${canPlan && !routeLoading ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"}`}
        >
          {routeLoading ? "Planning Route..." : "Plan Route"}
        </button>
        {selectedQuote && (
          <div className="text-xs text-slate-600 dark:text-slate-400 self-center">
            Using quote <span className="font-medium">{selectedQuote.ref}</span>
          </div>
        )}
      </div>

      {/* Route Results */}
      {routeLoading && (
        <div className="mt-3 text-sm opacity-70">Calculating routes…</div>
      )}
      
      {routeError && (
        <div className="mt-3 text-sm text-red-600">Error: {routeError}</div>
      )}
      
      {routeData && (
        <div className="rounded-2xl border bg-white dark:bg-slate-900/60 shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-3">Route Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routeData.options?.map((option, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      option.mode === 'ocean' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {option.mode.toUpperCase()}
                    </span>
                    <span className="font-semibold text-sm">{option.carrier}</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${option.cost_usd.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {option.description}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Transit: {option.transit_days} days</span>
                  <span>Reliability: {(option.reliability * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
