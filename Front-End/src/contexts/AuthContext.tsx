import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  authHeaders,
  clearAuthStorage,
  getStoredToken,
  getStoredUsername,
  login as apiLogin,
  setAuthStorage,
} from "../api/authApi";

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [username, setUsername] = useState<string | null>(() => getStoredUsername());

  const login = useCallback(async (id: string, pw: string) => {
    const { accessToken, username: u } = await apiLogin(id, pw);
    setAuthStorage(accessToken, u);
    setToken(accessToken);
    setUsername(u);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUsername(null);
  }, []);

  useEffect(() => {
    setToken(getStoredToken());
    setUsername(getStoredUsername());
  }, []);

  const value: AuthContextValue = {
    token,
    username,
    isAuthenticated: !!token,
    login,
    logout,
    authHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
