import { useEffect, useRef, useState } from "react";
import { pingApi } from "../utils/apiBase";

export default function ApiStatusBanner() {
  const [msg, setMsg] = useState(null);
  const tries = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const r = await pingApi();
      if (cancelled) return;
      if (r.ok) { 
        setMsg(null); 
        return; 
      }
      setMsg(`API connection issue — ${r.reason ?? "server not responding"}`);
      // backoff up to 5 tries: 0s, 2s, 4s, 8s, 16s
      if (tries.current < 5) {
        const delay = Math.pow(2, tries.current) * 2000;
        tries.current += 1;
        timer.current = window.setTimeout(run, delay);
      }
    };
    run();
    return () => { 
      cancelled = true; 
      if (timer.current) window.clearTimeout(timer.current); 
    };
  }, []);

  if (!msg) return null;
  return (
    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
      {msg} • Check that FastAPI is running and VITE_API_BASE points to it.
    </div>
  );
}
