import { useCallback, useState } from "react";

export function useFactoryDetails() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any|null>(null);
  const [error, setError] = useState<string|null>(null);

  const load = useCallback(async (factoryId: string) => {
    setLoading(true); 
    setError(null);
    try {
      const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
      const r = await fetch(`${base}/factories/${factoryId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Non-JSON");
      const js = await r.json();
      console.debug("Factory details", js);
      setData(js);
    } catch (e:any) { 
      setError(e.message || "Failed"); 
      setData(null); 
    }
    finally { 
      setLoading(false); 
    }
  }, []);

  return { loading, data, error, load, setData };
}
