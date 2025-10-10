// apps/web/src/lib/api.ts
// Single resilient fetch client with named helpers.
// Exposes apiUrl, apiURL(), apiFetch, apiGet, apiPost, apiPut, apiDelete.
// Includes a few aliases to avoid breaking older code.

export const apiUrl: string = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
export function apiURL(): string { return apiUrl; } // legacy alias

type Json = Record<string, any>;

function buildUrl(path: string, params?: Record<string, any>): string {
  const base = path.startsWith("http") ? path : `${apiUrl}${path}`;
  if (!params) return base;
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${apiUrl}${path}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} · ${body || "No body"}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  } catch (e: any) {
    throw new Error(`Network error: ${e?.message || e}`);
  }
}

export function apiGet(path: string, params?: Record<string, any>, opts: RequestInit = {}) {
  return apiFetch(buildUrl(path, params), { method: "GET", ...opts });
}

export function apiPost(path: string, body?: Json, opts: RequestInit = {}) {
  return apiFetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...opts });
}

export function apiPut(path: string, body?: Json, opts: RequestInit = {}) {
  return apiFetch(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, ...opts });
}

export function apiDelete(path: string, opts: RequestInit = {}) {
  return apiFetch(path, { method: "DELETE", ...opts });
}

// ---- App-specific calls (optional convenience) ----
export function searchFactories(payload: Json) {
  return apiPost("/v1/suppliers/search", payload);
}

export function getSupplier(supplierId: string) {
  return apiGet(`/v1/suppliers/${encodeURIComponent(supplierId)}`);
}

export async function getSupplierDetails(payload: {
  id?: string; name?: string; url?: string; source?: string; country?: string; product_type?: string;
}) {
  const res = await apiPost(`/v1/suppliers/details`, payload);
  return {
    ...res,
    profile: res?.profile ? normalizeSupplierProfile(res.profile) : undefined,
  };
}

export function healthz() {
  return apiGet("/healthz");
}

// ---- Legacy aliases to avoid breaking imports ----
export const postJson = apiPost;
export const getJson = apiGet;

// ---- Additional compatibility functions ----
export async function ingestSearchWithFile(
  file: File,
  opts: { include_freshness?: boolean; location?: string | null; product_type_hint?: string | null } = {}
) {
  // Try multipart (file + JSON blob)
  try {
    const form = new FormData();
    form.append("file", file);
    if (opts && Object.keys(opts).length) {
      form.append(
        "payload",
        new Blob(
          [
            JSON.stringify({
              include_freshness: !!opts.include_freshness,
              location: opts.location ?? null,
              product_type_hint: opts.product_type_hint ?? null,
            }),
          ],
          { type: "application/json" }
        )
      );
    }
    const r = await fetch(`${apiUrl}/v1/search/ingest`, { method: "POST", body: form });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  } catch {
    // Fallback: upload → ingest by URL
    const up = new FormData();
    up.append("file", file);
    const u = await fetch(`${apiUrl}/v1/uploads/image`, { method: "POST", body: up });
    if (!u.ok) throw new Error(await u.text());
    const { file_url } = await u.json();

    const r2 = await fetch(`${apiUrl}/v1/search/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_url,
        include_freshness: !!opts.include_freshness,
        location: opts.location ?? null,
        product_type_hint: opts.product_type_hint ?? null,
      }),
    });
    if (!r2.ok) throw new Error(await r2.text());
    return r2.json();
  }
}

export async function searchFactoriesUnified(payload: Json) {
  const res = await searchFactories(payload);
  const items = Array.isArray(res?.items) ? res.items.map(normalizeSupplierItem) : [];
  return { ...res, items };
}

// --- Unified Search (internal + web) ---
export type UnifiedSearchRequest = {
  q: string;
  country?: string;
  product_type?: string;
  quantity?: number;
  customization?: 'any' | 'yes' | 'no';
  image_upload_id?: string | null;
  min_score?: number;
};

export type UnifiedSearchResponse = {
  items: any[];
  meta?: {
    warning?: string;
    image_summary?: string;
    providers_used?: Record<string, boolean>;
    passes?: Array<{
      pass: number;
      thr: number;
      candidates: number;
      kept: number;
      t: number;
    }>;
    elapsed_ms?: number;
  };
};

export async function unifiedSearch(body: UnifiedSearchRequest): Promise<UnifiedSearchResponse> {
  return apiPost('/v1/search', body);
}

export async function llmSearch(body: {
  q?: string; country?: string; product_type?: string;
  quantity?: number; customization?: "any"|"yes"|"no"; image_label?: string; min_score?: number;
}) {
  const res = await fetch(`${apiUrl}/v1/llm-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{items:any[]; meta:any;}>;
}

export type FulfillmentPayload = {
  origin_country: string;
  destination_country: string;
  incoterm: "EXW"|"FCA"|"FAS"|"FOB"|"CFR"|"CIF"|"CPT"|"CIP"|"DAP"|"DPU"|"DDP";
  ready_date?: string;
  quantity?: number;
  weight_kg?: number;
  cbm?: number;
  units_per_carton?: number;
  num_cartons?: number;
  product_type?: string;
  product_description?: string;
  hs_code?: string;
  customization?: "yes"|"no"|"any";
  target_mode?: "sea"|"air"|"rail"|"truck"|"express"|"multimodal";
  budget_usd?: number;
  priority?: "speed"|"cost"|"balanced"|"low_co2";
  origin_city?: string;
  origin_port?: string;
  dest_city?: string;
  dest_port?: string;
  exporter_ready?: boolean;
  importer_ready?: boolean;
  notes?: string;
};

export async function requestFulfillmentPlan(payload: FulfillmentPayload) {
  const res = await fetch(`${apiUrl}/v1/llm/fulfillment-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Fulfillment error: ${res.status} ${t}`);
  }
  return res.json();
}

export type SavedVendor = {
  id: string;
  name: string;
  originCountry?: string;
  destinationCountry?: string;
  originCity?: string;
  destinationCity?: string;
  originPort?: string;
  destinationPort?: string;
  incoterm?: string;
  productType?: string;
  productDescription?: string;
  country?: string;
  city?: string;
};

export type SavedQuote = {
  id: string;
  quoteId?: string;
  originCountry?: string;
  destinationCountry?: string;
  originCity?: string;
  destinationCity?: string;
  originPort?: string;
  destinationPort?: string;
  incoterm?: string;
  productType?: string;
  productDescription?: string;
  mode?: string;
  estimatedCostUsd?: number;
  date?: string;
  lanes?: string;
};

export async function listSavedVendors(): Promise<SavedVendor[]> {
  try {
    const res = await fetch(`${apiUrl}/v1/vendors/saved`);
    if (!res.ok) return [];
    return await res.json();
  } catch { 
    // TODO: Implement saved vendors endpoint
    return []; 
  }
}

export async function listSavedQuotes(): Promise<SavedQuote[]> {
  try {
    const res = await fetch(`${apiUrl}/v1/quotes/saved`);
    if (!res.ok) return [];
    return await res.json();
  } catch { 
    // TODO: Implement saved quotes endpoint
    return []; 
  }
}

export function getIncoterms() {
  return apiGet("/v1/fulfillment/incoterms");
}

export function makePlan(payload: { incoterm: string; fields: Record<string, any> }) {
  return apiPost("/v1/fulfillment/plan", payload);
}

export async function uploadImageForCaption(file: File) {
  const form = new FormData();
  form.append("file", file);
  const url = `${apiUrl}/v1/vision/caption`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json(); // { caption }
}

// ---- Placeholder exports for legacy imports ----
export const alibabaApi = {
  oauthUrl: async (state: string) => ({ url: '/api/alibaba/oauth' }),
  providerConfig: async () => ({ connected: false }),
  status: async () => ({ connected: false }),
};

export const goalsApi = {
  get: async () => [],
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => ({}),
};

export const debug = {
  log: console.log,
  error: console.error,
};

export const integrations = {
  list: async () => [],
  connect: async () => ({}),
  disconnect: async () => ({}),
};

export const adminAlgo = {
  get: async () => ({}),
  update: async () => ({}),
};

export const debugRoutes = {
  list: async () => [],
  test: async () => ({}),
};

// Removed duplicate export - using the function above

// ---- Supplier Type Normalization ----
import type { SupplierListItem, SupplierProfile } from "../types/supplier";

function toArray(x: any): string[] | undefined {
  if (!x) return undefined;
  if (Array.isArray(x)) return x.filter(Boolean).map(String);
  return [String(x)];
}

export function normalizeSupplierItem(x: any): SupplierListItem {
  return {
    id: x.id ?? x.supplier_id ?? undefined,
    name: x.name ?? x.title ?? undefined,
    country: x.country ?? x.location ?? undefined,
    region: x.region ?? undefined,
    url: x.url ?? x.site ?? x.link ?? null, // fallbacks
    source: x.source ?? (x.domain ? String(x.domain) : undefined),
    productTypes: toArray(x.product_types ?? x.productTypes ?? x.category),
    score: typeof x.score === "number" ? x.score : undefined,
    moq: x.moq ?? x.MOQ ?? undefined,
    leadDays: x.lead_days ?? x.leadDays ?? undefined,
    priceUsd: x.price_usd ?? x.priceUsd ?? undefined,
    materials: toArray(x.materials),
    certs: toArray(x.certs ?? x.certifications),
    reasoning: x.reasoning ?? undefined,
    reasons: toArray(x.reasons),
    contributions: x.contributions ?? undefined,
    isBest: !!x.is_best,
    belowThreshold: !!x.belowThreshold,
    sourceUrl: x.source_url ?? x.sourceUrl ?? undefined,
    marketplaceMeta: x.marketplace_meta ?? x.marketplaceMeta ?? undefined,
  };
}

export function normalizeSupplierProfile(x: any): SupplierProfile {
  const base = normalizeSupplierItem(x);
  return {
    ...base,
    address: x.address ?? undefined,
    email: x.email ?? undefined,
    phone: x.phone ?? undefined,
    leadTime: x.lead_time ?? x.leadTime ?? undefined,
    capabilities: x.capabilities ?? undefined,
    exportMarkets: x.export_markets ?? x.exportMarkets ?? undefined,
    membership: x.membership ?? undefined,
    alibabaId: x.alibaba_id ?? x.alibabaId ?? undefined,
    notes: x.notes ?? undefined,
    _cache: !!x._cache,
  };
}