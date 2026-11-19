import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL, getStoredToken } from '../api/client';
import { logger } from './logger';

// Make Pusher globally available for Laravel Echo
(window as any).Pusher = Pusher;

let echoInstance: Echo<any> | null = null;

/**
 * Get or initialize the singleton Laravel Echo instance configured for Reverb WebSockets.
 */
export const getEcho = async (): Promise<Echo<any>> => {
  const token = await getStoredToken();
  const host = process.env.EXPO_PUBLIC_REVERB_HOST || 'ws.erp.kabhyan.com';
  const key = process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'kabhyan-erp-key-2026';
  const port = Number(process.env.EXPO_PUBLIC_REVERB_PORT || 443);
  const scheme = process.env.EXPO_PUBLIC_REVERB_SCHEME || 'https';
  const isTls = scheme === 'https' || port === 443;

  if (!echoInstance) {
    try {
      echoInstance = new Echo({
        broadcaster: 'reverb',
        key: key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: isTls,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      });
      logger.info(`[Reverb] Initialized Echo client connected to ${host}:${port}`);
    } catch (err) {
      logger.warn('[Reverb] Failed to initialize Echo client:', err);
    }
  } else if (token && echoInstance.options) {
    echoInstance.options.auth = {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return echoInstance as Echo<any>;
};

/**
 * Disconnect Echo on logout or session reset.
 */
export const disconnectEcho = () => {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      // Safe ignore
    }
    echoInstance = null;
  }
};
