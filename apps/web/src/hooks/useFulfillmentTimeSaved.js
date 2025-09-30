import { useCallback, useEffect, useState } from "react";

/**
 * Hook for fulfillment-specific time saved metrics
 * Reuses the same data structure as Supply Center but focuses on fulfillment workflow
 */
export function useFulfillmentTimeSaved() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get fulfillment-specific metrics first
      const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
      const res = await fetch(`${base}/metrics/fulfillment`);
      
      if (res.ok) {
        const json = await res.json();
        setData(json);
        return;
      }
      
      // Fallback: use supply center metrics if fulfillment endpoint doesn't exist
      const fallbackRes = await fetch(`${base}/metrics/supply_center`);
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        // Use the same time metrics but label them for fulfillment context
        setData({
          time_saved_minutes: json.time_saved_minutes || 0,
          time_baseline_minutes: json.time_baseline_minutes || 1,
          // Add fulfillment-specific context
          fulfillment_specific: false
        });
        return;
      }
      
      // Final fallback: placeholder data
      setData({
        time_saved_minutes: 135, // 2h 15m example
        time_baseline_minutes: 420, // 7h baseline example
        fulfillment_specific: false,
        isPlaceholder: true
      });
    } catch (e) {
      setError(e.message || "Failed to load fulfillment metrics");
      // Set placeholder data on error
      setData({
        time_saved_minutes: 135,
        time_baseline_minutes: 420,
        fulfillment_specific: false,
        isPlaceholder: true
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    data,
    error,
    reload: load
  };
}
