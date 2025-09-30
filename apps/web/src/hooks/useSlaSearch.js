import { useState, useCallback } from "react";
import { apiPost } from "../lib/api";

export function useSlaSearch() {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const search = useCallback(async (query, opts = {}) => {
    setState({ loading: true, data: null, error: null });
    try {
      const body = { query, ...opts };
      const data = await apiPost("/ai/search", body);
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message || "Search failed" });
    }
  }, []);

  return { ...state, search };
}
