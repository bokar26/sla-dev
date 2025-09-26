import { useState, useEffect } from 'react';
import { SupplierRow, PortfolioFilters } from '../../types/portfolio';

export function useSuppliers(filters: PortfolioFilters) {
  const [data, setData] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.region && filters.region !== 'ALL') params.append('region', filters.region);
        if (filters.search) params.append('search', filters.search);

        const response = await fetch(`http://localhost:8000/api/portfolio/suppliers?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.suppliers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
        console.error('Suppliers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.from, filters.to, filters.region, filters.search]);

  return { data, loading, error };
}
