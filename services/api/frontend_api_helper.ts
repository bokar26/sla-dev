// Frontend API helper for SLA API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = <T>(path: string, init: RequestInit = {}) =>
  fetch(`${API_URL}${path}`, { 
    headers: { 
      "Content-Type": "application/json", 
      ...(init.headers || {}) 
    }, 
    ...init 
  })
    .then(async r => r.ok ? r.json() as Promise<T> : Promise.reject(await r.text()));

export const uploadImage = async (file: File) => {
  const form = new FormData(); 
  form.append("file", file);
  const r = await fetch(`${API_URL}/v1/uploads/image`, { 
    method: "POST", 
    body: form 
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

// Vision extraction
export const extractVision = async (fileUrl: string) => {
  return api('/v1/vision/extract', {
    method: 'POST',
    body: JSON.stringify({ file_url: fileUrl })
  });
};

// Supplier search
export const searchSuppliers = async (query: string, filters?: {
  materials?: string[];
  country?: string;
  moq_max?: number;
  certs?: string[];
}) => {
  return api('/v1/suppliers/search', {
    method: 'POST',
    body: JSON.stringify({ q: query, ...filters })
  });
};
