import { useState, useCallback, useEffect } from "react";
import { getApiBase, safeJson } from "../utils/apiBase";

export function useSlaSuggestions() {
  const [state, setState] = useState({ loading: false, data: null, error: null });
  const API = getApiBase();

  const load = useCallback(async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const res = await fetch(`${API}/ai/suggestions?status=new&limit=5`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} — ${t.slice(0,120)}`);
      }
      const data = await safeJson(res);
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: { suggestions: [] }, error: e.message });
    }
  }, [API]);

  const act = useCallback(async (suggestion_id, action, days=7) => {
    try {
      const res = await fetch(`${API}/ai/suggestions/action`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ suggestion_id, action, days })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e) {
      // keep the card visible even on error
    }
  }, [API, load]);

  useEffect(()=>{ load(); }, [load]);

  return { ...state, reload: load, act };
}
