import { useState, useCallback } from "react";
import { apiPost } from "../lib/api";

export function useFulfillmentRoutes() {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const fetchRoutes = useCallback(async (payload) => {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await apiPost("/ai/fulfillment/options", payload);
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message || "Failed to get routes" });
    }
  }, []);

  return { ...state, fetchRoutes };
}
