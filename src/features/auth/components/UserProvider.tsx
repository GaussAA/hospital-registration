"use client";

import { createContext, useContext, useState, useEffect, useCallback, startTransition, type ReactNode } from "react";

/* ── Types ── */
interface UserInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface UserContextValue {
  user: UserInfo | null;
  loading: boolean;
  setUser: (user: UserInfo | null) => void;
  refreshUser: () => Promise<void>;
}

/* ── Context ── */
const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
  refreshUser: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

/* ── Provider ── */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.code === 0) {
          setUser(json.data);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user on mount (page refresh / navigation)
  useEffect(() => {
    startTransition(() => {
      refreshUser();
    });
  }, [refreshUser]);

  return <UserContext.Provider value={{ user, loading, setUser, refreshUser }}>{children}</UserContext.Provider>;
}
