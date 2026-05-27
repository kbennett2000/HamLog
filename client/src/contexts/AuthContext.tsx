import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/hamlog-api';

interface User {
  userId: number;
  username: string;
  callsign: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, callsign: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hamlog_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('hamlog_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe(token)
      .then(profile => {
        setUser(profile);
        setLoading(false);
      })
      .catch(() => {
        logout();
        setLoading(false);
      });
  }, [token, logout]);

  const login = async (username: string, password: string) => {
    const result = await api.loginUser(username, password);
    localStorage.setItem('hamlog_token', result.token);
    setToken(result.token);
    setUser({ userId: result.user.id, username: result.user.username, callsign: result.user.callsign });
  };

  const register = async (username: string, password: string, callsign: string) => {
    const result = await api.registerUser(username, password, callsign);
    localStorage.setItem('hamlog_token', result.token);
    setToken(result.token);
    setUser({ userId: result.user.id, username: result.user.username, callsign: result.user.callsign });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
