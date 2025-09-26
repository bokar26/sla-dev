// src/services/quotes.ts
import type { FulfillmentOrder } from '@/types/fulfillment';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export interface Quote {
  id: string;
  factoryId: string;
  sku?: string;
  quantity?: number;
  currency: string;
  price: number; // unit or total — UI decides
  createdAt: string; // ISO
  status?: QuoteStatus;
  source?: 'internal' | 'alibaba';
  fulfillment?: Partial<FulfillmentOrder>;
}

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8000/api');

async function safeFetch<T>(path: string, init?: RequestInit, fallback: T = [] as unknown as T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[quotes.service] Failed ${init?.method || 'GET'} ${path}:`, err);
    return fallback;
  }
}

/** Named export USED by Fulfillment.tsx */
export async function getQuotes(params?: { factoryId?: string; status?: QuoteStatus }): Promise<Quote[]> {
  const qs = new URLSearchParams();
  if (params?.factoryId) qs.set('factoryId', params.factoryId);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  // Expecting GET /api/quotes — return [] if backend missing
  return safeFetch<Quote[]>(`/quotes${query}`, undefined, []);
}

export async function createQuote(payload: Partial<Quote>): Promise<Quote | null> {
  return safeFetch<Quote | null>(`/quotes`, { method: 'POST', body: JSON.stringify(payload) }, null);
}

export async function updateQuote(id: string, patch: Partial<Quote>): Promise<Quote | null> {
  return safeFetch<Quote | null>(`/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }, null);
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  return safeFetch<Quote | null>(`/quotes/${id}`, undefined, null);
}

// Optional helpers for "Saved" page
export async function listSavedQuotes(): Promise<Quote[]> {
  return safeFetch<Quote[]>(`/saved/quotes`, undefined, []);
}
export async function saveQuoteToSaved(id: string): Promise<boolean> {
  const ok = await safeFetch<{ ok: boolean }>(`/saved/quotes/${id}`, { method: 'PUT' }, { ok: false });
  return !!ok?.ok;
}

export type { Quote as SLAQuote };

// Additional exports for other components
export async function generateQuote(payload: any): Promise<any> {
  // Handle the complex payload structure from QuoteEditor
  if (payload.factoryId && payload.payload) {
    // For now, return a mock QuoteCalc object since the backend doesn't have quote generation yet
    const mockCalc = {
      unitCost: payload.payload.targetPrice || 5.50,
      toolingCost: 500,
      freightEstimate: 200,
      tariffEstimate: 50,
      moqAdjustment: 0,
      marginEstimate: 0.15,
      currency: 'USD',
      breakdown: [
        { label: 'Base Cost', value: payload.payload.targetPrice || 5.50 },
        { label: 'Tooling', value: 500 },
        { label: 'Freight', value: 200 },
        { label: 'Tariff', value: 50 },
        { label: 'Margin (15%)', value: (payload.payload.targetPrice || 5.50) * 0.15 }
      ],
      subtotal: (payload.payload.targetPrice || 5.50) * (payload.payload.quantity || 1000) + 500 + 200 + 50,
      tax: ((payload.payload.targetPrice || 5.50) * (payload.payload.quantity || 1000) + 500 + 200 + 50) * 0.08,
      total: ((payload.payload.targetPrice || 5.50) * (payload.payload.quantity || 1000) + 500 + 200 + 50) * 1.08,
      deliveryTime: `${payload.payload.desiredLeadTimeDays || 30} days`,
      terms: 'Net 30',
      validity: '30 days',
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: payload.payload.notes || ''
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockCalc;
  }
  
  // Fallback for simple payload
  return {
    unitCost: 5.50,
    subtotal: 5500,
    tax: 440,
    total: 5940,
    deliveryTime: '30 days',
    currency: 'USD'
  };
}

export async function saveQuote(payload: any): Promise<Quote | null> {
  // Handle the complex payload structure from QuoteEditor
  if (payload.factoryId && payload.calc) {
    // Create a mock saved quote with proper structure
    const savedQuote: Quote = {
      id: `quote-${Date.now()}`,
      factoryId: payload.factoryId,
      factoryName: payload.factoryName || 'Unknown Factory',
      status: payload.status || 'saved',
      input: payload.input || {},
      calc: payload.calc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: payload.source || 'internal',
      sourceId: payload.sourceId || payload.factoryId,
      storefrontUrl: payload.storefrontUrl
    };
    
    // Store in localStorage
    try {
      const existingQuotes = localStorage.getItem('saved_quotes');
      const quotes = existingQuotes ? JSON.parse(existingQuotes) : [];
      quotes.push(savedQuote);
      localStorage.setItem('saved_quotes', JSON.stringify(quotes));
      console.log('Quote saved to localStorage:', savedQuote);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('quoteSaved', { detail: savedQuote }));
    } catch (err) {
      console.warn('Failed to save quote to localStorage:', err);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return savedQuote;
  }
  
  // Fallback for simple id + data structure
  if (typeof payload === 'string') {
    return updateQuote(payload, {});
  }
  
  // Fallback for simple payload
  return createQuote(payload);
}

export async function listQuotes(): Promise<Quote[]> {
  // First try to get from localStorage (saved quotes)
  try {
    const savedQuotes = localStorage.getItem('saved_quotes');
    if (savedQuotes) {
      const parsed = JSON.parse(savedQuotes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved quotes from localStorage:', err);
  }
  
  // Fallback to API
  return getQuotes();
}

export async function deleteQuote(id: string): Promise<boolean> {
  // First try to delete from localStorage
  try {
    const existingQuotes = localStorage.getItem('saved_quotes');
    if (existingQuotes) {
      const quotes = JSON.parse(existingQuotes);
      const filteredQuotes = quotes.filter((q: Quote) => q.id !== id);
      localStorage.setItem('saved_quotes', JSON.stringify(filteredQuotes));
      console.log('Quote deleted from localStorage:', id);
      return true;
    }
  } catch (err) {
    console.warn('Failed to delete quote from localStorage:', err);
  }
  
  // Fallback to API
  const result = await safeFetch<{ success: boolean }>(`/quotes/${id}`, { method: 'DELETE' }, { success: false });
  return !!result?.success;
}