import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL, getStoredToken } from '../api/client';
import { logger } from './logger';

/**
 * Safely unwrap constructor functions across ESM and CommonJS bundling in React Native Metro.
 * Prevents "TypeError: Object cannot be used as a constructor" when packages are exported as { default: Class }.
 */
const resolveConstructor = (mod: any): any => {
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod.default === 'function') return mod.default;
  if (mod && mod.default && typeof mod.default.default === 'function') return mod.default.default;
  return mod;
};

const EchoConstructor = resolveConstructor(Echo);
const PusherConstructor = resolveConstructor(Pusher);

// Register Pusher constructor globally for both web and React Native
if (typeof window !== 'undefined') {
  (window as any).Pusher = PusherConstructor;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Pusher = PusherConstructor;
}

let echoInstance: Echo<any> | null = null;

/**
 * Get or initialize the singleton Laravel Echo instance configured for Reverb WebSockets.
 */
export const getEcho = async (): Promise<Echo<any> | null> => {
  const token = await getStoredToken();
  const host = process.env.EXPO_PUBLIC_REVERB_HOST || 'ws.erp.kabhyan.com';
  const key = process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'kby7f8a92c4e1d5b3a6081e74f29d3c8';
  const port = Number(process.env.EXPO_PUBLIC_REVERB_PORT || 443);
  const scheme = process.env.EXPO_PUBLIC_REVERB_SCHEME || 'https';
  const isTls = scheme === 'https' || port === 443;

  if (!echoInstance) {
    try {
      // Initialize Pusher directly using the resolved constructor
      const pusherClient = new PusherConstructor(key, {
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

      // Instantiate Echo using the resolved EchoConstructor and inject the pusher client
      echoInstance = new EchoConstructor({
        broadcaster: 'reverb',
        key: key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: isTls,
        enabledTransports: ['ws', 'wss'],
        client: pusherClient,
        Pusher: PusherConstructor,
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

  return echoInstance;
};
