// src/lib/apiBase.ts
const RAW = (import.meta as any)?.env?.VITE_API_URL || "";
export const API_BASE = RAW?.replace(/\/$/, "") || "";

// Build absolute URL for API paths; supports absolute passthrough
export function apiUrl(path: string) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
}