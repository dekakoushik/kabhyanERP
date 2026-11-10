"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, api } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.request("/auth/me");
      setUser(res.user);
      api.setUser(res.user);
    } catch {
      api.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      const publicPaths = ["/login"];
      const isPublic = publicPaths.includes(pathname);

      if (!user && !isPublic) {
        router.push("/login");
      } else if (user && isPublic) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const login = (token: string, userData: User) => {
    api.setToken(token);
    api.setUser(userData);
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await api.request("/auth/logout", { method: "POST" });
    } catch {
      // Proceed with local logout regardless of network error
    } finally {
      api.removeToken();
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

