import { useCallback, useEffect, useState } from "react";

export type SupplierRow = {
  id: string;
  vendor_name: string;
  country_iso2?: string;
  city?: string;
  category?: string;
  updated_at?: string;
};

export function useSuppliersSummary(limit = 5) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ total: number; items: SupplierRow[] }>({ total: 0, items: [] });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
      const res = await fetch(`${base}/suppliers/summary?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Non-JSON: ${txt.slice(0,120)}`);
      }
      const json = await res.json();
      setData({ total: Number(json?.total ?? 0), items: Array.isArray(json?.items) ? json.items : [] });
    } catch (e:any) {
      setError(e.message || "Failed to load suppliers");
      setData({ total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(()=>{ load(); }, [load]);

  return { loading, data, error, reload: load };
}
