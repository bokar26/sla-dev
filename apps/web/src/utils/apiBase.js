export function getApiBase() {
  return (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
}

export async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Non-JSON (${res.status}): ${text.slice(0,120)}`);
  }
  return res.json();
}

export async function pingApi() {
  const base = getApiBase();
  try {
    // prefer /health; /healthz exists too but keep one canonical call
    const res = await fetch(`${base}/health`, { credentials: "omit" });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const js = await safeJson(res);
    return js?.ok ? { ok: true } : { ok: false, reason: "health not ok" };
  } catch (e) {
    return { ok: false, reason: e?.message || "fetch failed" };
  }
}
