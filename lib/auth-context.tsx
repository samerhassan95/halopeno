"use client";

import * as React from "react";
import { api, setTokens, clearTokens, getAccessToken } from "@/lib/api/client";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  jobTitle: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("vantage-user");
    const token = getAccessToken();
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>(
      "/auth/login",
      { email, password }
    );
    setTokens(data.accessToken, data.refreshToken);
    window.localStorage.setItem("vantage-user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = React.useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    clearTokens();
    window.localStorage.removeItem("vantage-user");
    setUser(null);
    window.location.href = "/admin/login";
  }, []);

  const value = React.useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
