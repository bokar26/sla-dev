import { useState, useEffect } from 'react';
import { PortfolioOverview, PortfolioFilters } from '../../types/portfolio';

export function usePortfolioOverview(filters: PortfolioFilters) {
  const [data, setData] = useState<PortfolioOverview | null>(null);
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

        const response = await fetch(`http://localhost:8000/api/portfolio/overview?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch portfolio overview');
        console.error('Portfolio overview fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.from, filters.to, filters.region]);

  return { data, loading, error };
}
