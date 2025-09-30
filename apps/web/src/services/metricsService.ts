// apps/web/src/services/metricsService.ts
import { apiGet } from '../lib/api';

export interface SupplyCenterMetrics {
  time_saved: { value: number; unit: string };
  cost_saved: { value: number; unit: string };
  total_without_sla: { value: number; unit: string };
  total_with_sla: { value: number; unit: string };
}

export interface AdminStats {
  total_users: number;
  total_factories: number;
  total_quotes: number;
  demo_pending: number;
}

/**
 * Get supply center metrics from the real API
 */
export async function getSupplyCenterMetrics(): Promise<SupplyCenterMetrics> {
  try {
    const response = await apiGet<SupplyCenterMetrics>('/metrics/supply_center');
    return response;
  } catch (error) {
    console.error('Failed to fetch supply center metrics:', error);
    // Return zero values on error instead of demo data
    return {
      time_saved: { value: 0, unit: 'hours' },
      cost_saved: { value: 0, unit: 'USD' },
      total_without_sla: { value: 0, unit: 'USD' },
      total_with_sla: { value: 0, unit: 'USD' }
    };
  }
}

/**
 * Get admin dashboard statistics from the real API
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const response = await apiGet<AdminStats>('/stats');
    return response;
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    // Return zero values on error instead of demo data
    return {
      total_users: 0,
      total_factories: 0,
      total_quotes: 0,
      demo_pending: 0
    };
  }
}