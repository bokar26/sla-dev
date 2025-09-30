// apps/web/src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  // allow empty bodies
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function apiGet(path, opts) {
  return request(path, { method: 'GET', ...opts });
}
export function apiPost(path, body, opts) {
  return request(path, { method: 'POST', body, ...opts });
}
export function apiPut(path, body, opts) {
  return request(path, { method: 'PUT', body, ...opts });
}
export function apiDelete(path, opts) {
  return request(path, { method: 'DELETE', ...opts });
}

// ✅ Back-compat for old imports
export const apiUrl = BASE_URL;

// Placeholder exports for legacy imports
export const alibabaApi = {
  oauthUrl: async (state) => ({ url: '/api/alibaba/oauth' }),
  providerConfig: async () => ({ connected: false }),
  status: async () => ({ connected: false }),
};

// (optional convenience)
export default { apiGet, apiPost, apiPut, apiDelete, apiUrl };