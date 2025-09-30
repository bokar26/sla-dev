// SLA Search service for AI-powered factory search with LLM query parsing and reranking
import { post } from "@/lib/http";

export interface SearchFilters {
  ingestedOnly?: boolean;
  regions?: string[];
  minMOQ?: number | null;
  certs?: string[];
  materials?: string[];
  leadTimeDaysMax?: number | null;
}

export interface SearchOptions {
  topK?: number;
  filters?: SearchFilters;
  llm?: {
    enabled: boolean;
    explanations: boolean;
    maxTokens: number;
  };
}

export interface SearchResult {
  factoryId: string;
  name: string;
  region: string;
  capabilities: string[];
  certs: string[];
  moq: number;
  leadTimeDays: number;
  score: number;
  reasons: string[];
  highlights: {
    materials?: string[];
    certs?: string[];
    region?: string[];
  };
  explanation?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  meta: {
    tookMs: number;
    retrievalK: number;
    reranked: boolean;
    source: string;
  };
}

export interface SearchRequest {
  q: string;
  topK: number;
  filters: SearchFilters;
  user: {
    orgId: string;
    userId: string;
  };
  llm: {
    enabled: boolean;
    explanations: boolean;
    maxTokens: number;
  };
}

// Cache for search results (client-side)
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Race safety: track active requests
let activeSearchCtr: AbortController | null = null;
let activeToken = 0;

export async function searchFactories(q: string, opts?: Partial<SearchOptions>): Promise<SearchResponse> {
  // Race safety: increment token and abort previous request
  activeToken++;
  const token = activeToken;
  
  if (activeSearchCtr) {
    activeSearchCtr.abort();
  }
  activeSearchCtr = new AbortController();

  const payload: SearchRequest = {
    q,
    topK: opts?.topK || 25,
    filters: {
      ingestedOnly: true, // Always enforce ingested-only
      ...(opts?.filters || {})
    },
    user: {
      orgId: 'default', // TODO: Get from auth context
      userId: 'default' // TODO: Get from auth context
    },
    llm: {
      enabled: true,
      explanations: true,
      maxTokens: 512,
      ...(opts?.llm || {})
    }
  };

  // Check cache first
  const cacheKey = `${payload.user.orgId}:${q}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      results: cached.results,
      meta: {
        tookMs: 0,
        retrievalK: cached.results.length,
        reranked: true,
        source: 'cache'
      }
    };
  }

  try {
    const data: SearchResponse = await post("/api/sla/search", payload, {
      signal: activeSearchCtr.signal
    });

    // Check if this request is still relevant
    if (token !== activeToken) {
      throw new Error('Request superseded');
    }
    
    // Cache successful results
    searchCache.set(cacheKey, {
      results: data.results,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error.message === 'Request superseded') {
      throw error; // Let the caller handle aborted requests
    }
    
    // On error, try to return cached results if available
    if (cached) {
      return {
        results: cached.results,
        meta: {
          tookMs: 0,
          retrievalK: cached.results.length,
          reranked: true,
          source: 'cache-error'
        }
      };
    }
    throw error;
  } finally {
    // Clean up if this was the active request
    if (activeSearchCtr && token === activeToken) {
      activeSearchCtr = null;
    }
  }
}

// Clear cache (useful for testing or when data changes)
export function clearSearchCache(): void {
  searchCache.clear();
}
