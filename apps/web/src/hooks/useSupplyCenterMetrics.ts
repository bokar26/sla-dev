import { useCallback, useEffect, useState } from "react";

export type SupplyCenterMetrics = {
  total_revenue_cents: number;
  commission_cents: number;
  open_orders: number;
  time_saved_minutes: number;
  time_baseline_minutes: number;
  cost_saved_cents: number;
  cost_baseline_cents: number;
};

export function useSupplyCenterMetrics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SupplyCenterMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/,"");
      const res = await fetch(`${base}/metrics/supply_center`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Non-JSON response");
      const json = await res.json();
      setData(json);
    } catch (e:any) {
      setError(e.message || "Failed to load metrics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { loading, data, error, reload: load };
}
