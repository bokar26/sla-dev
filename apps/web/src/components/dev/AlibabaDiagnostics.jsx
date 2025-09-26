// @ts-nocheck
import React, { useEffect, useState } from "react";
import { api, debug, integrations } from "../../lib/api";

export default function AlibabaDiagnostics() {
  const [info, setInfo] = useState({ base: api.base, prefix: api.prefix });
  const [health, setHealth] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [ping, setPing] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try { setHealth(await debug.health()); } catch (e) { setErr(`health: ${e?.message}`); }
      try { setRoutes(await debug.routes()); } catch (e) { setErr(`${err ?? ""}\nroutes: ${e?.message}`); }
      try { setPing(await integrations.ping()); } catch (e) { setErr(`${err ?? ""}\nping: ${e?.message}`); }
    })();
  }, []);

  return (
    <div className="fixed right-4 bottom-4 z-[9999] w-[520px] max-w-[92vw] rounded-xl border bg-background/95 shadow-lg p-3 text-xs">
      <div className="font-semibold mb-2">Alibaba Diagnostics</div>
      <div className="grid grid-cols-2 gap-2">
        <div>BASE</div><code className="truncate">{info.base}</code>
        <div>PREFIX</div><code className="truncate">{info.prefix}</code>
      </div>
      {err && <div className="mt-2 text-red-600 whitespace-pre-wrap">{err}</div>}
      <details className="mt-2">
        <summary>health</summary>
        <pre className="max-h-[30vh] overflow-auto">{JSON.stringify(health, null, 2)}</pre>
      </details>
      <details className="mt-2">
        <summary>routes</summary>
        <pre className="max-h-[30vh] overflow-auto">{JSON.stringify(routes, null, 2)}</pre>
      </details>
      <details className="mt-2">
        <summary>ping</summary>
        <pre className="max-h-[30vh] overflow-auto">{JSON.stringify(ping, null, 2)}</pre>
      </details>
    </div>
  );
}
