// src/utils/debug-production.ts - Production stub that does nothing
/**
 * Production version of debug utility
 * All methods are no-ops to ensure zero performance impact in production
 */

export type DebugCategory = 
  | 'api' | 'auth' | 'dashboard' | 'navigation' | 'ui' 
  | 'storage' | 'performance' | 'fallback' | 'general';

// No-op implementations for production
const noop = () => {};
const noopReturn = () => false;
const noopReturnEmpty = () => [];
const noopReturnObject = () => ({});

export const debug = {
  // Core methods
  enable: noop,
  disable: noop,
  toggle: noopReturn,
  
  // Category management
  enableCategory: noop,
  disableCategory: noop,
  enableAllCategories: noop,
  disableAllCategories: noop,
  
  // Log methods
  getLogs: noopReturnEmpty,
  clearLogs: noop,
  exportLogs: noop,
  
  // Status
  getStatus: noopReturnObject,
  showHelp: noop,
  isEnabled: noopReturn,
  
  // Category-specific logging (all no-ops)
  api: noop,
  apiError: noop,
  auth: noop,
  authWarn: noop,
  dashboard: noop,
  dashboardError: noop,
  navigation: noop,
  ui: noop,
  storage: noop,
  perf: noop,
  fallback: noop,
  general: noop,
};

export class DebugManager {
  static getInstance() {
    return debug;
  }
}