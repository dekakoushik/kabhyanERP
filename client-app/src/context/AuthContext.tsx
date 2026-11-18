import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { User, portalApi } from "../api/portal";
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  subscribeToUnauthorized,
} from "../api/client";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { logger } from "../utils/logger";

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
      logger.warn("[AuthContext] Push token sync skipped or failed:", err);
    }
  };

  const logout = useCallback(async () => {
    try {
      // 1. Remove push notification token from backend if registered
      if (pushToken) {
        try {
          await portalApi.removeDeviceToken(pushToken);
        } catch (e) {
          logger.warn("[AuthContext] Push token removal skipped on logout:", e);
        }
      }

      // 2. Revoke Sanctum personal access token on the server
      try {
        await portalApi.logout();
      } catch (e) {
        logger.warn("[AuthContext] Server token revocation skipped (network or expired):", e);
      }

      // 3. Purge credentials from hardware KeyStore / Keychain & local storage
      await removeStoredToken();

      // 4. Reset React state
      setToken(null);
      setUser(null);
      setPushToken(null);
    } catch (err) {
      logger.error("[AuthContext] Error during logout:", err);
    }
  }, [pushToken]);

  // Subscribe to automatic session expiry on 401 Unauthorized
  useEffect(() => {
    const unsubscribe = subscribeToUnauthorized(() => {
      logger.warn("[AuthContext] Session invalid or expired. Performing auto-logout.");
      logout();
    });
    return () => unsubscribe();
  }, [logout]);

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
        logger.error("[AuthContext] Failed to load session:", err);
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
