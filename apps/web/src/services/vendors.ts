// Vendor service for fetching real vendor details
import { get, post } from "@/lib/http";

export interface VendorDetails {
  factoryId: string;
  name: string;
  region: string;
  city: string;
  countriesServed: string[];
  capabilities: string[];
  materials: string[];
  certs: string[];
  compliance: {
    iso9001: boolean;
    wrap: boolean;
    sedex: boolean;
  };
  moq: number;
  leadTimeDays: number;
  onTimeRate: number;
  defectRate: number;
  avgQuoteUsd: number;
  recentBuyers: string[];
  images: string[];
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  notes: string;
  ingestion_status: string;
}

// Cache for vendor details (client-side)
const vendorCache = new Map<string, { data: VendorDetails; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getVendor(factoryId: string, opts?: { signal?: AbortSignal }): Promise<VendorDetails> {
  // Check cache first
  const cached = vendorCache.get(factoryId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    // Try vendors path first
    const data = await get(`/api/vendors/${encodeURIComponent(factoryId)}`, { signal: opts?.signal });
    
    // Cache successful results
    vendorCache.set(factoryId, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (e: any) {
    // If vendors path fails with 404, try factories path
    if (e.message.includes('404')) {
      try {
        const data = await get(`/api/factories/${encodeURIComponent(factoryId)}`, { signal: opts?.signal });
        
        // Cache successful results
        vendorCache.set(factoryId, {
          data,
          timestamp: Date.now()
        });

        return data;
      } catch (fallbackError) {
        // Both paths failed
        if (fallbackError.name === 'AbortError') {
          throw fallbackError; // Let the caller handle aborted requests
        }
        throw fallbackError;
      }
    }
    
    // Non-404 error from vendors path
    if (e.name === 'AbortError') {
      throw e; // Let the caller handle aborted requests
    }
    throw e;
  }
}

// Prefetch vendor details for smoother UX
export async function prefetchVendor(factoryId: string): Promise<void> {
  if (vendorCache.has(factoryId)) {
    return; // Already cached
  }
  
  try {
    await getVendor(factoryId);
  } catch (error) {
    // Silently fail for prefetch - don't show errors
    console.debug('Vendor prefetch failed:', error);
  }
}

// Clear vendor cache (useful for testing or when data changes)
export function clearVendorCache(): void {
  vendorCache.clear();
}

// Save vendor to user's collection
export async function saveVendor(factoryId: string): Promise<{ saved: boolean; factory_id: string }> {
  return post("/api/saved/factories", { factory_id: factoryId });
}

// Create quote with vendor pre-selection
export async function createQuote(payload: {
  factory_id: string;
  vendor_name: string;
  inquiry_text: string;
  product_type: string;
  quantity?: number;
  lead_time_days?: number;
  materials_required: string;
  origin_city: string;
  origin_country_iso2: string;
}): Promise<{ id: string; ref: string; status: string }> {
  return post("/api/quotes/create", payload);
}

// Save vendor to user's collection with type classification
export async function saveVendorToCollection(factoryId: string, source: string = "search"): Promise<{ 
  saved: boolean; 
  vendorId: string; 
  vendor_type: "factory" | "supplier";
  alreadySaved?: boolean;
}> {
  const payload = { factoryId, vendorId: factoryId, source };
  
  // Try primary path first
  try {
    return await post("/api/vendors/save", payload);
  } catch (e: any) {
    if (!e.message.includes('404')) throw e;
    // Fallback to alias path if vendors/save isn't present
    return await post("/api/factories/save", payload);
  }
}
