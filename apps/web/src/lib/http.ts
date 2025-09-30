// src/lib/http.ts
import { apiUrl } from "./api";

async function parse(r: Response) {
  const text = await r.text();
  try { return text ? JSON.parse(text) : null; } catch { return text || null; }
}

export type HttpOptions = {
  method?: "GET"|"POST"|"PUT"|"PATCH"|"DELETE";
  body?: any;
  headers?: Record<string,string>;
  signal?: AbortSignal;
  // If sending FormData, pass body=FormData and do not set Content-Type
  rawPath?: string; // optional absolute path override
};

export async function http(path: string, opts: HttpOptions = {}) {
  const url = opts.rawPath ? opts.rawPath : apiUrl(path);
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;

  const res = await fetch(url, {
    method: opts.method || "GET",
    credentials: "include",
    headers: isForm ? undefined : {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    body: isForm ? (opts.body as FormData) : (opts.body ? JSON.stringify(opts.body) : undefined),
    signal: opts.signal,
  });

  const data = await parse(res);
  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.detail)) || res.statusText;
    throw new Error(`${res.status} ${res.statusText}${msg ? `: ${msg}` : ""}`);
  }
  return data;
}

// Helpers
export const get  = (p: string, o: HttpOptions = {}) => http(p, { ...o, method: "GET" });
export const post = (p: string, body?: any, o: HttpOptions = {}) => http(p, { ...o, method: "POST", body });
export const put  = (p: string, body?: any, o: HttpOptions = {}) => http(p, { ...o, method: "PUT", body });
export const patch= (p: string, body?: any, o: HttpOptions = {}) => http(p, { ...o, method: "PATCH", body });
export const del  = (p: string, o: HttpOptions = {}) => http(p, { ...o, method: "DELETE" });
