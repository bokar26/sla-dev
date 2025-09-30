import { create } from 'zustand';

type Role = 'user' | 'admin' | null;

type AuthState = {
  token: string | null;
  role: Role;
  isAuthenticated: boolean;
  setAuth: (token: string, role: Role) => void;
  clear: () => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  role: (localStorage.getItem('auth_role') as Role) ?? null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  setAuth: (token, role) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_role', role ?? '');
    set({ token, role, isAuthenticated: true });
  },
  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    set({ token: null, role: null, isAuthenticated: false });
  },
  logout: () => {
    get().clear();
  },
}));