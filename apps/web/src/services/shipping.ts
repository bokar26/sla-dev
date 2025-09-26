// src/services/shipping.ts
import type { FulfillmentOrder } from '@/types/fulfillment';
import type { SLAQuote } from '@/services/quotes';

export type ShippingPreference = 'fastest' | 'cheapest' | 'balanced' | 'green';

export interface ShippingPlanRequest {
  quoteId: string;
  destination: string;           // freeform address/city+country
  preference: ShippingPreference; // fastest | cheapest | balanced | green
}

export interface ShippingProgressEvent {
  type: 'progress' | 'options' | 'done' | 'error';
  message?: string;
  options?: ShippingOption[];
}

export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;             // e.g., "Express Air", "Sea LCL"
  etaDays: number;
  priceUsd: number;
  co2kg?: number;
  origin: string;
  destination: string;
  weightKg: number;
  volumeM3: number;
  route: string[];            // port/airport hops
  notes?: string;
}

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8000/api');

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Start a planning task on the backend (backend calls Mistral). */
export async function startShippingPlan(req: ShippingPlanRequest): Promise<{ taskId: string }> {
  return json<{ taskId: string }>(`${API_BASE}/shipping/plan`, {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/** Live stream of progress messages via SSE; returns an unsubscribe fn. */
export function streamShippingPlan(
  taskId: string,
  onEvent: (evt: ShippingProgressEvent) => void
): () => void {
  const url = `${API_BASE}/shipping/plan/${taskId}/events`;
  // Prefer SSE
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {
      // ignore malformed events
    }
  };
  es.onerror = () => {
    // Fallback: one terminal error event
    onEvent({ type: 'error', message: 'Stream disconnected' });
    es.close();
  };
  return () => es.close();
}

/** Final result (if you need to fetch after stream completes) */
export async function getShippingResult(taskId: string): Promise<{ options: ShippingOption[] }> {
  return json<{ options: ShippingOption[] }>(`${API_BASE}/shipping/plan/${taskId}/result`);
}
