import { registerRootComponent } from 'expo';

// Intercept global uncaught errors to capture exact stack trace
if (typeof (globalThis as any).ErrorUtils !== 'undefined') {
  const originalErrorHandler = (globalThis as any).ErrorUtils.getGlobalHandler();
  (globalThis as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error(">>> [FATAL_CRASH_CAPTURE] Error:", error);
    if (error && error.stack) {
      console.error(">>> [FATAL_CRASH_STACK]:\n" + error.stack);
    }
    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

