import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { login as apiLogin, me } from '../api/auth';

interface UserInfo {
  id: number;
  username: string;
  realName: string | null;
  roles: string[];
}

interface AuthContextValue {
  token: string | null;
  user: UserInfo | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canEdit: () => boolean;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserInfo | null>(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await me();
      const u: UserInfo = {
        id: data.id,
        username: data.username,
        realName: data.realName ?? null,
        roles: (data.roles ?? []).map((r: { code: string }) => r.code),
      };
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  useEffect(() => {
    if (token && !user) refreshUser();
  }, [token, user, refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiLogin(username, password);
    setToken(data.access_token);
    setUser({
      id: data.user.id,
      username: data.user.username,
      realName: data.user.realName ?? null,
      roles: data.user.roles ?? [],
    });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user.id,
      username: data.user.username,
      realName: data.user.realName,
      roles: data.user.roles,
    }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  const canEdit = useCallback(() => {
    return (user?.roles?.includes('ADMIN') || user?.roles?.includes('EDITOR')) ?? false;
  }, [user]);

  const isAdmin = useCallback(() => {
    return user?.roles?.includes('ADMIN') ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, canEdit, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
