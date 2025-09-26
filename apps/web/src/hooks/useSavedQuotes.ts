import { useCallback, useEffect, useState } from "react";

export type SavedQuote = {
  id: string;
  ref: string;
  product?: string;
  vendor_name?: string;
  origin_city?: string;
  origin_country_iso2?: string;
  origin_port_code?: string;
  incoterm?: string;
  weight_kg?: number;
  volume_cbm?: number;
  ready_date?: string;
  qty?: number;
  unit_cost?: number;
  status?: string;
  created_at?: string;
};

export function useSavedQuotes(limit = 100) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SavedQuote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); 
    setError(null);
    try {
      const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
      const res = await fetch(`${base}/saved-quotes?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Non-JSON: ${txt.slice(0,120)}`);
      }
      const js = await res.json();
      setData(Array.isArray(js?.items) ? js.items : []);
    } catch (e:any) {
      setError(e.message || "Failed to load saved quotes");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(()=>{ load(); }, [load]);

  return { loading, data, error, reload: load };
}