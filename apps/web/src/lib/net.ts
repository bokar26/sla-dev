/**
 * Network utilities and API connectivity management
 */
import { API_BASE } from '../config';

/**
 * Ping the API health endpoint with timeout
 */
export async function pingAPI(signal?: AbortSignal): Promise<boolean> {
  const url = `${API_BASE}/health`;
  const controller = new AbortController();
  const s = signal ?? controller.signal;
  const t = setTimeout(() => controller.abort(), 2500);
  
  try {
    const res = await fetch(url, { 
      credentials: 'include', 
      signal: s 
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
