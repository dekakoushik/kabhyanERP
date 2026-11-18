/**
 * Production-safe logger utility for Kabhyan Connect.
 * Suppresses diagnostic messages in production release builds to prevent
 * sensitive corporate metadata or device push tokens from leaking via adb logcat.
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
  },
};
