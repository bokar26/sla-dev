import { useEffect, useState, useCallback } from "react";

export function useAdminStats() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ vendor_count: 0, factory_count_total: 0 });
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Add a small delay to ensure the API is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
      const res = await fetch(`${base}/admin/stats`, { credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Non-JSON: ${txt.slice(0,120)}`);
      }
      const js = await res.json();
      setData({
        vendor_count: Number(js?.vendor_count ?? 0),
        factory_count_total: Number(js?.factory_count_total ?? 0),
      });
    } catch (e) {
      console.warn("Admin stats error:", e);
      setError(e?.message || "Failed to load stats");
      setData({ vendor_count: 0, factory_count_total: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, data, error, reload: load };
}
