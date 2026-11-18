import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { User, portalApi } from "../api/portal";
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken } from "../api/client";
import { registerForPushNotificationsAsync } from "../utils/notifications";

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
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to safely register push notification token with backend
  const syncPushToken = async () => {
    try {
      const pToken = await registerForPushNotificationsAsync();
      if (pToken) {
        setPushToken(pToken);
        await portalApi.registerDeviceToken({
          push_token: pToken,
          platform: Platform.OS,
          device_name: Device.modelName ?? `${Device.manufacturer || "Device"} ${Device.osName || ""}`,
        });
      }
    } catch (err) {
      console.warn("[AuthContext] Push token sync skipped or failed:", err);
    }
  };

  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          // Sync device push token for this active session
          syncPushToken();
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
      // Register device push token after login
      await syncPushToken();
    }
  };

  const logout = async () => {
    try {
      if (pushToken) {
        try {
          await portalApi.removeDeviceToken(pushToken);
        } catch (e) {
          // Ignore network errors on token removal during logout
        }
      }
      await removeStoredToken();
      setToken(null);
      setUser(null);
      setPushToken(null);
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
