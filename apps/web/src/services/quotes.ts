// src/services/quotes.ts
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
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

/** Named export USED by Fulfillment.tsx */
export async function getQuotes(params?: { factoryId?: string; status?: QuoteStatus }): Promise<Quote[]> {
  const qs = new URLSearchParams();
  if (params?.factoryId) qs.set('factoryId', params.factoryId);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  try {
    return await apiGet(`/quotes${query}`);
  } catch {
    return []; // Return empty array if backend missing
  }
}

export async function createQuote(payload: Partial<Quote>): Promise<Quote | null> {
  try {
    return await apiPost("/quotes/create", payload);
  } catch {
    return null;
  }
}

export async function updateQuote(id: string, patch: Partial<Quote>): Promise<Quote | null> {
  try {
    return await apiPut(`/quotes/${id}`, patch);
  } catch {
    return null;
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    return await apiGet(`/quotes/${id}`);
  } catch {
    return null;
  }
}

// Optional helpers for "Saved" page
export async function listSavedQuotes(): Promise<Quote[]> {
  try {
    const result = await apiGet("/saved-quotes");
    return result?.items || [];
  } catch {
    return [];
  }
}

export async function saveQuoteToSaved(id: string): Promise<boolean> {
  try {
    const result = await apiPut(`/saved/quotes/${id}`, {});
    return !!result;
  } catch {
    return false;
  }
}

export type { Quote as SLAQuote };

// Additional exports for other components
export async function generateQuote(payload: any): Promise<any> {
  // Replaced demo/mock with real API call: see services/serviceMap.md
  try {
    const response = await apiPost('/quotes/create', payload);
    return response;
  } catch (error) {
    console.error('Failed to generate quote:', error);
    // Return minimal fallback on error
    return {
      unitCost: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      deliveryTime: 'N/A',
      currency: 'USD'
    };
  }
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
  try {
    const result = await del(`/api/quotes/${id}`);
    return !!result?.success;
  } catch {
    return false;
  }
}