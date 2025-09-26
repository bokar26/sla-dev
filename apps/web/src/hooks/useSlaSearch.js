import { useState, useCallback } from "react";

export function useSlaSearch() {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const search = useCallback(async (query, opts = {}) => {
    setState({ loading: true, data: null, error: null });
    try {
      const body = { query, ...opts };
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message || "Search failed" });
    }
  }, []);

  return { ...state, search };
}
