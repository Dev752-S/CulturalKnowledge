import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logoutFirebase } from '../lib/firebase';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  teamName?: string | null;
  photoUrl?: string | null;
}

export interface AuthContextType {
  user: SessionUser | null;
  hasTeamName: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<{ user: SessionUser | null; hasTeamName: boolean }>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  hasTeamName: false,
  isLoading: false,
  checkAuth: async () => ({ user: null, hasTeamName: false }),
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hasTeamName, setHasTeamName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) {
        setUser(null);
        setHasTeamName(false);
        return { user: null, hasTeamName: false };
      }
      const data = await res.json();
      if (data.success && data.user) {
        const teamDone = Boolean(
          data.hasTeamName || (data.user.teamName && data.user.teamName.trim().length > 0)
        );
        setUser(data.user);
        setHasTeamName(teamDone);
        return { user: data.user, hasTeamName: teamDone };
      } else {
        setUser(null);
        setHasTeamName(false);
        return { user: null, hasTeamName: false };
      }
    } catch {
      setUser(null);
      setHasTeamName(false);
      return { user: null, hasTeamName: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFirebase();
    } catch {
      // ignore firebase offline error
    }
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setHasTeamName(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, hasTeamName, isLoading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext) || defaultAuthContext;
}
