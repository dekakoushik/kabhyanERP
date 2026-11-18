import React, { createContext, useContext, useState, useEffect } from "react";
import { User, portalApi } from "../api/portal";
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await portalApi.login({ email, password: pass });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      await setStoredToken(res.token);
      await setStoredUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await removeStoredToken();
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const refreshUser = async () => {
    // re-fetch dashboard to update client info if needed
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
