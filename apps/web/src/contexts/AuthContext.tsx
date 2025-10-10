// apps/web/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { loadSession, logout as logoutService, login as loginService } from '../services/authService';

type User = { email: string; name?: string; role?: 'user' | 'admin' } | null;

type AuthCtx = {
  user: User;
  login: (email: string, password: string, options?: { admin?: boolean }) => Promise<{ token: string; user: User }>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  // Load session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser(session.user);
    }
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    setUser,
    async login(email: string, password: string, options?: { admin?: boolean }) {
      const result = await loginService({ email, password, remember: true });
      setUser(result.user);
      return result;
    },
    logout() {
      logoutService();
      setUser(null);
    },
  }), [user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
