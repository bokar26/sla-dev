import { useState, useEffect } from 'react';
import { SupplierDetail, PortfolioFilters } from '../../types/portfolio';

export function useSupplierDetail(supplierId: string | null, filters: PortfolioFilters) {
  const [data, setData] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplierId) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);

        const response = await fetch(`http://localhost:8000/api/portfolio/supplier/${supplierId}?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch supplier detail');
        console.error('Supplier detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId, filters.from, filters.to]);

  return { data, loading, error };
}
