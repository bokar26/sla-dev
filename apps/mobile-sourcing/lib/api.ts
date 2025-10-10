// Mobile API client - adapted from web app
// Single resilient fetch client with named helpers for React Native

export const apiUrl: string = "http://localhost:8000"; // TODO: make configurable

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

// ---- App-specific calls ----
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

// ---- Supplier Type Normalization ----
export type SupplierListItem = {
  id?: string;
  name?: string;
  country?: string;
  region?: string;
  url?: string | null;
  source?: string;
  productTypes?: string[];
  score?: number;
  moq?: number;
  leadDays?: number;
  priceUsd?: number;
  materials?: string[];
  certs?: string[];
  reasoning?: string;
  reasons?: string[];
  contributions?: any;
  isBest?: boolean;
  belowThreshold?: boolean;
  sourceUrl?: string;
  marketplaceMeta?: any;
};

export type SupplierProfile = SupplierListItem & {
  address?: string;
  email?: string;
  phone?: string;
  leadTime?: string;
  capabilities?: any;
  exportMarkets?: any;
  membership?: any;
  alibabaId?: string;
  notes?: string;
  _cache?: boolean;
};

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
