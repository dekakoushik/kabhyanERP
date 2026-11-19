import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { logger } from "../utils/logger";

export const API_BASE_URL = "https://erp.kabhyan.com/api/v1";

const TOKEN_KEY = "kabhyan_client_token";
const USER_KEY = "kabhyan_client_user";

// Event listener mechanism for 401 Unauthorized / Session Expiry
type UnauthorizedHandler = () => void;
let unauthorizedHandlers: UnauthorizedHandler[] = [];

export function subscribeToUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.push(handler);
  return () => {
    unauthorizedHandlers = unauthorizedHandlers.filter((h) => h !== handler);
  };
}

function notifyUnauthorized() {
  for (const handler of unauthorizedHandlers) {
    try {
      handler();
    } catch (e) {
      logger.error("[Client] Error in unauthorized handler:", e);
    }
  }
}

/**
 * Retrieve the Sanctum auth token securely.
 * Uses hardware-backed Android KeyStore / iOS Keychain via expo-secure-store.
 * Automatically migrates any legacy plaintext token found in AsyncStorage.
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS !== "web") {
      const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (secureToken) {
        return secureToken;
      }

      // Check and migrate from legacy AsyncStorage if present
      const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (legacyToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, legacyToken, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
        await AsyncStorage.removeItem(TOKEN_KEY);
        return legacyToken;
      }
      return null;
    }
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    logger.warn("[Client] Failed to retrieve secure token:", err);
    return null;
  }
}

/**
 * Persist the Sanctum auth token in encrypted secure storage.
 */
export async function setStoredToken(token: string): Promise<void> {
  try {
    if (Platform.OS !== "web") {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      // Ensure legacy unencrypted copy is purged
      await AsyncStorage.removeItem(TOKEN_KEY);
      return;
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    logger.error("[Client] Failed to store secure token:", err);
  }
}

/**
 * Remove stored credentials across all storage layers.
 */
export async function removeStoredToken(): Promise<void> {
  try {
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (err) {
    logger.error("[Client] Failed to remove stored token:", err);
  }
}

export async function getStoredUser(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: any): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    logger.error("[Client] Failed to store user profile cache:", err);
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = await getStoredToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (options.params) {
    const query = Object.entries(options.params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (query) {
      url += (url.includes("?") ? "&" : "?") + query;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (Token expired, revoked, or invalid)
  if (response.status === 401 && !endpoint.includes("/auth/login")) {
    logger.warn(`[Client] Session expired or unauthorized for ${endpoint}. Triggering auto-logout.`);
    notifyUnauthorized();
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = "Network request failed";
    if (typeof data === "object" && data !== null) {
      if ((data as any).errors && typeof (data as any).errors === "object") {
        const firstErrKey = Object.keys((data as any).errors)[0];
        const firstErrVal = (data as any).errors[firstErrKey];
        errorMessage = Array.isArray(firstErrVal) ? firstErrVal[0] : String(firstErrVal);
      } else {
        errorMessage = (data as any).message || (data as any).error || `Request failed with status ${response.status}`;
      }
    } else if (typeof data === "string" && data.length > 0) {
      errorMessage = data;
    }
    throw new Error(errorMessage);
  }

  return data as T;
}
