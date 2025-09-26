import { Factory } from '../types/factory';

export interface FactorySearchParams {
  query?: string;
  location?: string;
  industry?: string;
  size?: string;
  brand?: string;
  limit?: number;
}

export interface FactorySearchResponse {
  results: Factory[];
  total_found: number;
  search_time: number;
}

export async function searchFactories(params: FactorySearchParams): Promise<FactorySearchResponse> {
  const response = await fetch('http://localhost:8000/api/factories/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query || '',
      location: params.location || null,
      industry: params.industry || null,
      size: params.size || null,
      brand: params.brand || null,
      limit: params.limit || 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to search factories: ${response.statusText}`);
  }

  return response.json();
}

export async function getFactory(id: string): Promise<Factory> {
  // For now, we'll use the search results to find a factory by ID
  // In a real implementation, you'd have a dedicated endpoint
  const response = await searchFactories({ query: '', limit: 1000 });
  const factory = response.results.find(f => f.id === id);
  
  if (!factory) {
    throw new Error(`Factory with ID ${id} not found`);
  }
  
  return factory;
}
