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
    // Expecting something like { access_token, user }
    const token = data?.access_token ?? data?.token ?? 'server-token';
    const user: User = data?.user ?? { email, name: 'SLA User', role: 'user' };
    saveSession(token, user, remember);
    return { token, user };
  } catch (err: any) {
    // Handle specific error cases
    if (err?.response?.status === 401) {
      const errorDetail = err?.response?.data?.detail;
      if (errorDetail === 'INVALID_CREDENTIALS') {
        throw new Error('Email or password is incorrect.');
      } else if (errorDetail === 'ACCOUNT_INACTIVE') {
        throw new Error('Account is inactive. Please contact support.');
      } else {
        throw new Error('Email or password is incorrect.');
      }
    }
    
    // Network or other errors
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw new Error('Login failed. Please try again.');
  }
}
