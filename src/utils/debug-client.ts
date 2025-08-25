// src/utils/debug-client.ts
/**
 * Client-side debug wrapper to handle SSR issues
 * This ensures debug system only initializes in the browser
 */

import { DebugCategory } from './debug';

// Import debug system only on client side
let debugInstance: any = null;

// Initialize debug system only in browser
const getDebugInstance = () => {
  if (typeof window === 'undefined') {
    // Server-side: return no-op functions
    return {
      api: () => {},
      apiError: () => {},
      auth: () => {},
      authWarn: () => {},
      dashboard: () => {},
      dashboardError: () => {},
      navigation: () => {},
      ui: () => {},
      storage: () => {},
      perf: () => {},
      fallback: () => {},
      general: () => {},
      enable: () => {},
      disable: () => {},
      toggle: () => false,
      enableCategory: () => {},
      disableCategory: () => {},
      enableAllCategories: () => {},
      disableAllCategories: () => {},
      getLogs: () => [],
      clearLogs: () => {},
      exportLogs: () => {},
      getStatus: () => ({}),
      showHelp: () => {},
      isEnabled: () => false,
    };
  }

  // Client-side: lazy load debug system
  if (!debugInstance) {
    const { debug } = require('./debug');
    debugInstance = debug;
  }

  return debugInstance;
};

// Export client-safe debug interface
export const debug = {
  // Category-specific logging
  api: (message: string, data?: any) => getDebugInstance().api(message, data),
  apiError: (message: string, data?: any) => getDebugInstance().apiError(message, data),
  auth: (message: string, data?: any) => getDebugInstance().auth(message, data),
  authWarn: (message: string, data?: any) => getDebugInstance().authWarn(message, data),
  dashboard: (message: string, data?: any) => getDebugInstance().dashboard(message, data),
  dashboardError: (message: string, data?: any) => getDebugInstance().dashboardError(message, data),
  navigation: (message: string, data?: any) => getDebugInstance().navigation(message, data),
  ui: (message: string, data?: any) => getDebugInstance().ui(message, data),
  storage: (message: string, data?: any) => getDebugInstance().storage(message, data),
  perf: (operation: string, message: string, data?: any) => getDebugInstance().perf(operation, message, data),
  fallback: (message: string, data?: any) => getDebugInstance().fallback(message, data),
  general: (message: string, data?: any) => getDebugInstance().general(message, data),

  // Control methods
  enable: () => getDebugInstance().enable(),
  disable: () => getDebugInstance().disable(),
  toggle: () => getDebugInstance().toggle(),

  // Category management
  enableCategory: (category: DebugCategory) => getDebugInstance().enableCategory(category),
  disableCategory: (category: DebugCategory) => getDebugInstance().disableCategory(category),
  enableAllCategories: () => getDebugInstance().enableAllCategories(),
  disableAllCategories: () => getDebugInstance().disableAllCategories(),

  // Log management
  getLogs: () => getDebugInstance().getLogs(),
  clearLogs: () => getDebugInstance().clearLogs(),
  exportLogs: () => getDebugInstance().exportLogs(),

  // Status
  getStatus: () => getDebugInstance().getStatus(),
  showHelp: () => getDebugInstance().showHelp(),
  isEnabled: (category?: DebugCategory) => getDebugInstance().isEnabled(category),
};

// Export type for use in other files
export type { DebugCategory };