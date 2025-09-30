import { useEffect, useState } from 'react';
import { getSupplyCenterMetrics, SupplyCenterMetrics } from '@/services/metricsService';

const ZERO: SupplyCenterMetrics = {
  total_revenue_cents: 0,
  commission_cents: 0,
  open_orders: 0,
  time_saved_minutes: 0,
  time_baseline_minutes: 1,
  cost_saved_cents: 0,
  cost_baseline_cents: 1,
};

export function useSupplyCenterMetricsSafe() {
  const [data, setData] = useState<SupplyCenterMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getSupplyCenterMetrics();
        if (alive) setData(res);
      } catch {
        if (alive) setData(ZERO); // fallback to zeros
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { data: data ?? ZERO, loading };
}
