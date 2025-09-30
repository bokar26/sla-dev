// apps/web/src/lib/api.ts

export const apiUrl = import.meta.env.VITE_API_URL;

/** CSRF token management */
function getCsrfTokenFromResponse(res: Response) {
  const token = res.headers.get("x-csrf-token");
  if (token) {
    sessionStorage.setItem("csrf", token);
  }
}

function getCsrfHeaders() {
  const csrf = sessionStorage.getItem("csrf");
  return csrf ? { "x-csrf-token": csrf } : {};
}

/** Enhanced error handling */
async function handleResponse(res: Response) {
  getCsrfTokenFromResponse(res);
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }
  
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

async function handle(res: Response) {
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export async function apiGet(path: string) {
  const res = await fetch(`${apiUrl}${path}`, { method: "GET", credentials: "include" });
  return handle(res);
}

export async function apiPost(path: string, body?: unknown) {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  return handle(res);
}

export async function apiPut(path: string, body?: unknown) {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  return handle(res);
}

export async function apiDelete(path: string) {
  const res = await fetch(`${apiUrl}${path}`, { method: "DELETE", credentials: "include" });
  return handle(res);
}

// Placeholder exports for legacy imports
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

export const api = {
  get: apiGet,
  post: apiPost,
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

export const unifiedSearch = {
  search: async () => [],
};
