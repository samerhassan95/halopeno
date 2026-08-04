"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api/client";

const TOKEN_KEY = "halopeno-customer-token";

export interface StorefrontCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  loyaltyPoints: number;
  preferredLanguage: string;
  preferredCurrency: string;
}

interface CustomerAuthContextValue {
  customer: StorefrontCustomer | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  authHeaders: () => Record<string, string>;
}

const CustomerAuthContext = React.createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = React.useState<StorefrontCustomer | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setCustomer(null);
      setToken(null);
      setLoading(false);
      return;
    }
    setToken(stored);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/storefront/account/me`,
        { headers: { Authorization: `Bearer ${stored}` }, cache: "no-store" }
      );
      if (!res.ok) throw new Error("unauthorized");
      const json = await res.json();
      setCustomer(json.data);
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      setCustomer(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function login(email: string, password: string) {
    const res = await api.post<{ accessToken: string; customer: StorefrontCustomer }>("/storefront/auth/login", {
      email,
      password,
    });
    window.localStorage.setItem(TOKEN_KEY, res.accessToken);
    setToken(res.accessToken);
    setCustomer(res.customer);
  }

  async function register(data: { name: string; email: string; password: string; phone?: string }) {
    const res = await api.post<{ accessToken: string; customer: StorefrontCustomer }>("/storefront/auth/register", data);
    window.localStorage.setItem(TOKEN_KEY, res.accessToken);
    setToken(res.accessToken);
    setCustomer(res.customer);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  }

  function authHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, token, loading, login, register, logout, refresh, authHeaders }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = React.useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}

export { ApiError, TOKEN_KEY as CUSTOMER_TOKEN_KEY };
