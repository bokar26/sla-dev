import { useState, useEffect } from 'react';
import { FactorySuggestion } from '../../types/portfolio';

export function useSuggestions(region: string, limit: number = 5) {
  const [data, setData] = useState<FactorySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('region', region);
        params.append('limit', limit.toString());

        const response = await fetch(`http://localhost:8000/api/portfolio/suggestions?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.suggestions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
        console.error('Suggestions fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region, limit]);

  return { data, loading, error };
}
