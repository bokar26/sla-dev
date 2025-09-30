import { post, get } from "@/lib/http";

export async function estimateQuote(payload: {
  vendor_id: string;
  product: any;
  quantity: number;
  destination: { country: string; city?: string; postcode?: string };
  incoterm?: string;
  freight_type?: string;
  speed?: string;
}) {
  return post("/api/quotes/estimate", payload);
}

// 1) Preview (no save)
export async function estimateQuotePreview(payload: any) {
  // try explicit no-persist param first
  try {
    return await post("/api/quotes/estimate?persist=false", payload);
  } catch {
    // fallback to plain estimate endpoint (assume it's preview-only)
    return await post("/api/quotes/estimate", payload);
  }
}

// 2) Persist the shown estimate as a Saved Quote; server should return { quote_id }
export async function saveEstimateAsQuote(body: any) {
  // Prefer a dedicated endpoint; fall back to generic create if needed.
  try {
    return await post("/api/quotes/save_estimate", body);
  } catch {
    return await post("/api/vendors/quotes", body); // adjust to your existing create endpoint
  }
}

export const getNegotiationTips = (quoteId: string) =>
  get(`/api/quotes/${quoteId}/negotiation-tips`);

// 3) Optional: list quotes used by Saved page (already present in your app)
export async function listSavedQuotes(params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.limit)  search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const qs = search.toString();
  return get(`/api/vendors/quotes${qs ? `?${qs}` : ""}`);
}