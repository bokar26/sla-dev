export async function createQuote(payload: any) {
  const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
  const r = await fetch(`${base}/quotes/create`, {
    method: "POST", 
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json(); // {id, ref}
}
