import { useState, useCallback } from "react";

export function useFulfillmentRoutes() {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const fetchRoutes = useCallback(async (payload) => {
    setState({ loading: true, data: null, error: null });
    try {
      const res = await fetch("/api/ai/fulfillment/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message || "Failed to get routes" });
    }
  }, []);

  return { ...state, fetchRoutes };
}
