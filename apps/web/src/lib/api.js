/**
 * Centralized API fetch wrapper with robust error handling
 * Uses BASE + PREFIX + relative path approach to avoid double /api
 */
import { apiStatusStore } from '../stores/apiStatus';

// Single source of truth for API configuration
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin;
// normalize base like 'http://localhost:8000' (no trailing slash)
const BASE = String(RAW_BASE).replace(/\/+$/, "");

const RAW_PREFIX = import.meta.env.VITE_API_PREFIX ?? "/api";
// normalize prefix like '/api' (leading slash, no trailing slash, empty allowed)
const PREFIX = RAW_PREFIX === "" ? "" : `/${RAW_PREFIX.replace(/^\/+|\/+$/g, "")}`;

const DEFAULT_TIMEOUT = 15000;

function joinUrl(path) {
  if (/^https?:\/\//i.test(path)) return path; // absolute override
  const rel = path.replace(/^\/+/, ""); // 'admin/algo-outputs'
  // collapse duplicate slashes only in the path part
  return `${BASE}${PREFIX}/${rel}`.replace(/([^:])\/{2,}/g, "$1/");
}

export async function apiFetch(path, init = {}) {
  const url = joinUrl(path); // <-- pass 'admin/algo-outputs', not '/api/...'
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs || DEFAULT_TIMEOUT);
  
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        ...(init?.headers || {}) 
      },
      signal: controller.signal,
      ...init,
    });
    
    // Update online status
    apiStatusStore.getState().setOnline(true);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} at ${url} :: ${text}`);
    }

    const ct = res.headers.get('content-type') ?? '';
    const isJson = ct.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    
    return body;
  } catch (e) {
    // Only flip to offline for network/abort, not for 4xx/5xx with a response
    const msg = String(e?.toString?.() ?? e);
    if (msg.includes('TypeError: Failed to fetch') || msg.includes('abort') || msg.includes('NetworkError')) {
      apiStatusStore.getState().setOnline(false);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// Export API configuration for debugging
export const api = {
  base: BASE,
  prefix: PREFIX,
  joinUrl,
};

/**
 * Health check endpoint
 */
export async function checkApiHealth() {
  try {
    await apiFetch('/health');
    return true;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
}

/**
 * Unified search API - handles both text and image search
 */
export async function unifiedSearch(query = '', files = [], options = {}) {
  const { topK = 10 } = options;
  
  if (files.length === 0) {
    // JSON text-only search
    return apiFetch('/api/search/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, topK })
    });
  } else {
    // multipart: text + images
    const formData = new FormData();
    formData.append('q', query);
    formData.append('topK', topK.toString());
    files.forEach((file) => formData.append('files', file, file.name));
    
    return apiFetch('/api/search/unified/multipart', {
      method: 'POST',
      body: formData
    });
  }
}

/**
 * Legacy text search API (for backward compatibility)
 */
export async function searchFactories(query, options = {}) {
  const {
    location = null,
    industry = null,
    size = null,
    brand = null,
    limit = 10,
    include_sources = ["internal"]
  } = options;

  return apiFetch('/api/factories/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      location,
      industry,
      size,
      brand,
      limit,
      include_sources
    })
  });
}

/**
 * Legacy reverse image search API (for backward compatibility)
 */
export async function reverseImageSearch(formData) {
  return apiFetch('/api/search/reverse-image', {
    method: 'POST',
    body: formData
  });
}

/**
 * Get configuration
 */
export async function getConfig() {
  return apiFetch('/api/config');
}

/**
 * Admin algo outputs API
 * Uses relative paths to avoid double /api prefix
 */
export const adminAlgo = {
  /**
   * List algorithm outputs with filtering and pagination
   */
  list: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    const path = queryString ? `admin/algo-outputs?${queryString}` : 'admin/algo-outputs';
    return apiFetch(path);
  },

  /**
   * Get detailed algorithm output by ID
   */
  get: async (id) => {
    return apiFetch(`admin/algo-outputs/${id}`);
  }
};

/**
 * Debug routes endpoint
 */
export const debugRoutes = () => apiFetch('debug/routes');

/**
 * Integrations API helper
 */
export const integrations = {
  ping: () => apiFetch('integrations/ping'),
  alibabaOAuthUrl: (state) => {
    const params = state ? { state } : undefined;
    return apiFetch('integrations/alibaba/oauth-url', params);
  },
};

/**
 * Alibaba integration API
 */
export const alibabaApi = {
  status: () => apiFetch('integrations/alibaba/status'),
  providerConfig: () => apiFetch('integrations/alibaba/provider-config'),
  oauthUrl: (state) => {
    const params = state ? { state } : undefined;
    return apiFetch('integrations/alibaba/oauth-url', params);
  },
};

/**
 * Goals API helper
 */
export const goalsApi = {
  list: () => apiFetch('goals'),
  create: (body) => apiFetch('goals', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => apiFetch(`goals/${id}`, { method: 'DELETE' }),
  progress: () => apiFetch('goals/progress'),
};

/**
 * Debug API helper
 */
export const debug = {
  routes: () => apiFetch('debug/routes'),
  health: () => apiFetch('health'),
};
