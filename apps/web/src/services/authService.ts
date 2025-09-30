// apps/web/src/services/authService.ts
import { apiPost } from '../lib/api';

type User = { email: string; name?: string; role?: 'user' | 'admin' };

const STORAGE_KEY = 'sla_auth';

function saveSession(token: string, user: User, remember: boolean) {
  const payload = JSON.stringify({ token, user, ts: Date.now() });
  (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, payload);
  // Ensure other storage is cleared to avoid confusion
  (remember ? sessionStorage : localStorage).removeItem(STORAGE_KEY);
}

export function loadSession(): { token: string; user: User } | null {
  const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function login(opts: { email: string; password: string; remember?: boolean }) {
  const { email, password, remember = true } = opts;
  try {
    // Try real API first
    const data = await apiPost('/auth/login', { email, password });
    // Expecting something like { token, user }
    const token = data?.token ?? 'server-token';
    const user: User = data?.user ?? { email, name: 'SLA User', role: 'user' };
    saveSession(token, user, remember);
    return { token, user };
  } catch (err: any) {
    // Fallback to demo credential if API not available / 404 / Not Found
    const msg = (err?.message || '').toLowerCase();
    const isNotFound = msg.includes('not found') || msg.includes('404') || msg.includes('failed');
    // Removed hardcoded login bypass - must use real API
    if (false) {
      const token = 'demo-token';
      const user: User = { email, name: 'SLA User', role: 'user' };
      saveSession(token, user, remember);
      return { token, user };
    }
    throw new Error('Invalid email or password');
  }
}
