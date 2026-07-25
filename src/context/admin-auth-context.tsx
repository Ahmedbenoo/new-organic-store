"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session");
        const payload = (await response.json()) as { authenticated?: boolean };

        if (!cancelled) {
          setIsAuthenticated(Boolean(payload.authenticated));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated,
      loading,
      async login(password) {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!response.ok) return false;

        setIsAuthenticated(true);
        return true;
      },
      async logout() {
        await fetch("/api/admin/logout", { method: "POST" });
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, loading],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}
