import { apiUrl } from "@/lib/api";

async function fetchJSON(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const text = await r.text().catch(() => "");
  if (!r.ok) {
    const err = new Error(`${r.status} ${r.statusText} ${text}`.trim());
    // @ts-ignore
    err.status = r.status;
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

export async function uploadVendors(files: File[]) {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  const r = await fetch(apiUrl("/api/uploads/vendors"), {
    method: "POST", 
    credentials: "include", 
    body: fd,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { created: SavedVendor[], deduped: number }
}

export async function uploadQuotes(files: File[]) {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  const r = await fetch(apiUrl("/api/uploads/quotes"), {
    method: "POST", 
    credentials: "include", 
    body: fd,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { created: SavedQuote[] }
}

export async function getSavedVendorIds() {
  return fetchJSON(apiUrl("/api/vendors/saved/ids"), { method: "GET" }); // -> { ids: string[] }
}
