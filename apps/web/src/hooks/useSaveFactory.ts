export async function saveFactory(factoryId: string) {
  const base = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/,"");
  const r = await fetch(`${base}/saved/factories`, {
    method: "POST", 
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ factory_id: factoryId })
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
