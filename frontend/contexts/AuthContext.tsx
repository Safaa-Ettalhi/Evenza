'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService, User } from '@/lib/api';

function parseTokenToUser(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { userId: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    const stored = localStorage.getItem('token');
    if (stored) {
      const u = parseTokenToUser(stored);
      if (u) {
        setToken(stored);
        setUser(u);
      } else {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { access_token } = await apiService.login({ email, password });
    if (typeof window !== 'undefined') localStorage.setItem('token', access_token);
    setToken(access_token);
    const u = parseTokenToUser(access_token) ?? null;
    setUser(u);
    if (!u) throw new Error('Erreur lors de la connexion');
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<User> => {
    await apiService.register({ email, password });
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading: isLoading || !isMounted,
        isAuthenticated: isMounted && !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
