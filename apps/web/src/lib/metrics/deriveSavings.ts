import type { SupplyCenterMetrics } from '../../hooks/useSupplyCenterMetrics';

export type TimeSavings = {
  savedHours: number;
  totalHours: number;
  withoutSlaHours: number;
  progress: number; // 0..1
};

export type CostSavings = {
  savedAmount: number;
  totalSpend: number;
  withoutSlaAmount: number;
  progress: number; // 0..1
};

export function deriveTimeSavings(raw: SupplyCenterMetrics): TimeSavings {
  const savedMinutes = raw.time_saved_minutes || 0;
  const baselineMinutes = Math.max(1, raw.time_baseline_minutes || 1);
  const totalMinutes = Math.max(1, baselineMinutes - savedMinutes);
  
  return {
    savedHours: savedMinutes / 60,
    totalHours: totalMinutes / 60,
    withoutSlaHours: baselineMinutes / 60,
    progress: Math.min(1, Math.max(0, savedMinutes / baselineMinutes))
  };
}

export function deriveCostSavings(raw: SupplyCenterMetrics): CostSavings {
  const savedCents = raw.cost_saved_cents || 0;
  const baselineCents = Math.max(1, raw.cost_baseline_cents || 1);
  const totalCents = Math.max(1, baselineCents - savedCents);
  
  return {
    savedAmount: savedCents / 100,
    totalSpend: totalCents / 100,
    withoutSlaAmount: baselineCents / 100,
    progress: Math.min(1, Math.max(0, savedCents / baselineCents))
  };
}
