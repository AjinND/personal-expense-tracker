// src/utils/debug.ts
/**
 * Centralized Debug System with SSR Support
 * - Works in both server and client environments
 * - Only functions in development environment
 * - Can be toggled on/off via localStorage or environment variable
 * - Organized debug categories for different parts of the app
 */

export type DebugCategory = 
  | 'api'           // API calls, responses, errors
  | 'auth'          // Authentication, sessions, tokens
  | 'dashboard'     // Dashboard data, hooks, context
  | 'navigation'    // Routing, navigation events
  | 'ui'            // UI interactions, state changes
  | 'storage'       // LocalStorage, data persistence
  | 'performance'   // Performance measurements, timing
  | 'fallback'      // Fallback API usage
  | 'general';      // General debug messages

interface DebugConfig {
  enabled: boolean;
  categories: Set<DebugCategory>;
  showTimestamps: boolean;
  showStackTrace: boolean;
  persistLogs: boolean;
  maxLogs: number;
}

interface DebugLogEntry {
  timestamp: number;
  category: DebugCategory;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  data?: any;
  stackTrace?: string;
}

interface DebugStatus {
  enabled: boolean;
  environment: 'development' | 'production';
  categories: string[];
  totalLogs: number;
  config: DebugConfig;
}

class DebugManager {
  private static instance: DebugManager;
  private config: DebugConfig;
  private logs: DebugLogEntry[] = [];
  private readonly STORAGE_KEY = 'expense_tracker_debug';
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isServer = typeof window === 'undefined';

  private constructor() {
    this.config = this.loadConfig();
    
    // Only setup in development and client-side
    if (this.isDevelopment && !this.isServer) {
      this.setupGlobalDebugger();
      this.setupPerformanceMonitoring();
    }
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  // Load debug configuration
  private loadConfig(): DebugConfig {
    const defaultConfig: DebugConfig = {
      enabled: false, // Disabled by default
      categories: new Set(['general']),
      showTimestamps: true,
      showStackTrace: false,
      persistLogs: false,
      maxLogs: 1000,
    };

    if (!this.isDevelopment) {
      return { ...defaultConfig, enabled: false };
    }

    // Server-side: use environment variables only
    if (this.isServer) {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        return {
          ...defaultConfig,
          enabled: true,
          categories: new Set(['api', 'auth', 'dashboard', 'general']),
        };
      }
      return defaultConfig;
    }

    // Client-side: use localStorage and environment variables
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultConfig,
          ...parsed,
          categories: new Set(parsed.categories || ['general']),
        };
      }
    } catch (error) {
      console.warn('Failed to load debug config:', error);
    }

    // Check environment variables
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      defaultConfig.enabled = true;
      defaultConfig.categories = new Set(['api', 'auth', 'dashboard', 'general']);
    }

    return defaultConfig;
  }

  // Save debug configuration (client-side only)
  private saveConfig(): void {
    if (!this.isDevelopment || this.isServer) return;

    try {
      const configToSave = {
        ...this.config,
        categories: Array.from(this.config.categories),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.warn('Failed to save debug config:', error);
    }
  }

  // Setup global debugger functions (client-side only)
  private setupGlobalDebugger(): void {
    if (this.isServer) return;

    (window as any).debug = {
      enable: () => this.enable(),
      disable: () => this.disable(),
      toggle: () => this.toggle(),
      
      // Category management
      enableCategory: (category: DebugCategory) => this.enableCategory(category),
      disableCategory: (category: DebugCategory) => this.disableCategory(category),
      enableAll: () => this.enableAllCategories(),
      disableAll: () => this.disableAllCategories(),
      
      // Log management
      logs: () => this.getLogs(),
      clear: () => this.clearLogs(),
      export: () => this.exportLogs(),
      
      // Status and help
      status: () => this.getStatus(),
      help: () => this.showHelp(),
    };

    console.log('🐛 Debug system initialized. Type "debug.help()" for commands.');
  }

  // Setup performance monitoring (client-side only)
  private setupPerformanceMonitoring(): void {
    if (this.isServer) return;

    // Monitor performance timing
    if ('performance' in window && 'addEventListener' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          this.perf('page-load', `Page loaded in ${pageLoadTime}ms`);
        }, 0);
      });
    }
  }

  // Core logging method
  private log(category: DebugCategory, level: 'log' | 'warn' | 'error' | 'info', message: string, data?: any): void {
    // Do nothing if not development or not enabled
    if (!this.isDevelopment || !this.config.enabled || !this.config.categories.has(category)) {
      return;
    }

    const timestamp = Date.now();
    const logEntry: DebugLogEntry = {
      timestamp,
      category,
      level,
      message,
      data,
      ...(this.config.showStackTrace && { stackTrace: new Error().stack }),
    };

    // Add to logs array
    if (this.config.persistLogs) {
      this.logs.push(logEntry);
      
      // Trim logs if over max
      if (this.logs.length > this.config.maxLogs) {
        this.logs = this.logs.slice(-this.config.maxLogs);
      }
    }

    // Only log to console on client-side
    if (!this.isServer) {
      const emoji = {
        api: '🌐',
        auth: '🔐', 
        dashboard: '📊',
        navigation: '🧭',
        ui: '🎨',
        storage: '💾',
        performance: '⚡',
        fallback: '🔧',
        general: '🐛'
      }[category] || '🐛';

      const timeStr = this.config.showTimestamps 
        ? `[${new Date(timestamp).toLocaleTimeString()}] `
        : '';

      const logMessage = `${emoji} ${timeStr}[${category.toUpperCase()}] ${message}`;

      // Use appropriate console method
      const consoleMethod = console[level] || console.log;
      
      if (data !== undefined) {
        consoleMethod(logMessage, data);
      } else {
        consoleMethod(logMessage);
      }
    }
  }

  // Control methods
  public enable(): boolean {
    if (!this.isDevelopment) return false;
    this.config.enabled = true;
    this.saveConfig();
    if (!this.isServer) {
      console.log('🐛 Debug mode enabled');
    }
    return true;
  }

  public disable(): boolean {
    if (!this.isDevelopment) return false;
    this.config.enabled = false;
    this.saveConfig();
    if (!this.isServer) {
      console.log('🐛 Debug mode disabled');
    }
    return false;
  }

  public toggle(): boolean {
    if (!this.isDevelopment) return false;
    const wasEnabled = this.config.enabled;
    this.config.enabled = !wasEnabled;
    this.saveConfig();
    if (!this.isServer) {
      console.log(`🐛 Debug mode ${this.config.enabled ? 'enabled' : 'disabled'}`);
    }
    return this.config.enabled;
  }

  // Category management
  public enableCategory(category: DebugCategory): void {
    if (!this.isDevelopment) return;
    this.config.categories.add(category);
    this.saveConfig();
    if (!this.isServer) {
      console.log(`🐛 Debug category '${category}' enabled`);
    }
  }

  public disableCategory(category: DebugCategory): void {
    if (!this.isDevelopment) return;
    this.config.categories.delete(category);
    this.saveConfig();
    if (!this.isServer) {
      console.log(`🐛 Debug category '${category}' disabled`);
    }
  }

  public enableAllCategories(): void {
    if (!this.isDevelopment) return;
    this.config.categories = new Set(['api', 'auth', 'dashboard', 'navigation', 'ui', 'storage', 'performance', 'fallback', 'general']);
    this.saveConfig();
    if (!this.isServer) {
      console.log('🐛 All debug categories enabled');
    }
  }

  public disableAllCategories(): void {
    if (!this.isDevelopment) return;
    this.config.categories.clear();
    this.saveConfig();
    if (!this.isServer) {
      console.log('🐛 All debug categories disabled');
    }
  }

  // Log management
  public getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    if (!this.isDevelopment) return;
    this.logs = [];
    if (!this.isServer) {
      console.log('🐛 Debug logs cleared');
    }
  }

  public exportLogs(): void {
    if (!this.isDevelopment || this.isServer) return;
    
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().substr(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Status and help
  public getStatus(): DebugStatus {
    return {
      enabled: this.config.enabled,
      environment: this.isDevelopment ? 'development' : 'production',
      categories: Array.from(this.config.categories),
      totalLogs: this.logs.length,
      config: this.config,
    };
  }

  public showHelp(): void {
    if (this.isServer) return;
    
    console.group('🐛 Debug System Help');
    console.log('Available commands:');
    console.log('  debug.enable()              - Enable debug mode');
    console.log('  debug.disable()             - Disable debug mode');
    console.log('  debug.toggle()              - Toggle debug mode');
    console.log('');
    console.log('  debug.enableCategory(cat)   - Enable specific category');
    console.log('  debug.disableCategory(cat)  - Disable specific category');
    console.log('  debug.enableAll()           - Enable all categories');
    console.log('  debug.disableAll()          - Disable all categories');
    console.log('');
    console.log('  debug.logs()                - Get all debug logs');
    console.log('  debug.clear()               - Clear debug logs');
    console.log('  debug.export()              - Export logs to file');
    console.log('');
    console.log('  debug.status()              - Show current status');
    console.log('');
    console.log('Available categories:', ['api', 'auth', 'dashboard', 'navigation', 'ui', 'storage', 'performance', 'fallback', 'general']);
    console.groupEnd();
  }

  // Convenience methods for different categories
  public api(message: string, data?: any): void {
    this.log('api', 'log', message, data);
  }

  public apiError(message: string, data?: any): void {
    this.log('api', 'error', message, data);
  }

  public auth(message: string, data?: any): void {
    this.log('auth', 'log', message, data);
  }

  public authWarn(message: string, data?: any): void {
    this.log('auth', 'warn', message, data);
  }

  public dashboard(message: string, data?: any): void {
    this.log('dashboard', 'log', message, data);
  }

  public dashboardError(message: string, data?: any): void {
    this.log('dashboard', 'error', message, data);
  }

  public navigation(message: string, data?: any): void {
    this.log('navigation', 'log', message, data);
  }

  public ui(message: string, data?: any): void {
    this.log('ui', 'log', message, data);
  }

  public storage(message: string, data?: any): void {
    this.log('storage', 'log', message, data);
  }

  public perf(operation: string, message: string, data?: any): void {
    this.log('performance', 'info', `${operation}: ${message}`, data);
  }

  public fallback(message: string, data?: any): void {
    this.log('fallback', 'warn', message, data);
  }

  public general(message: string, data?: any): void {
    this.log('general', 'log', message, data);
  }

  // Check if debug is enabled for a category
  public isEnabled(category?: DebugCategory): boolean {
    if (!this.isDevelopment) return false;
    if (!this.config.enabled) return false;
    if (!category) return true;
    return this.config.categories.has(category);
  }
}

// Create debug instance - works in both server and client environments
const debugInstance = DebugManager.getInstance();

// Export singleton instance with SSR-safe interface
export const debug = {
  // Category-specific logging
  api: (message: string, data?: any) => debugInstance.api(message, data),
  apiError: (message: string, data?: any) => debugInstance.apiError(message, data),
  auth: (message: string, data?: any) => debugInstance.auth(message, data),
  authWarn: (message: string, data?: any) => debugInstance.authWarn(message, data),
  dashboard: (message: string, data?: any) => debugInstance.dashboard(message, data),
  dashboardError: (message: string, data?: any) => debugInstance.dashboardError(message, data),
  navigation: (message: string, data?: any) => debugInstance.navigation(message, data),
  ui: (message: string, data?: any) => debugInstance.ui(message, data),
  storage: (message: string, data?: any) => debugInstance.storage(message, data),
  perf: (operation: string, message: string, data?: any) => debugInstance.perf(operation, message, data),
  fallback: (message: string, data?: any) => debugInstance.fallback(message, data),
  general: (message: string, data?: any) => debugInstance.general(message, data),

  // Control methods
  enable: () => debugInstance.enable(),
  disable: () => debugInstance.disable(),
  toggle: () => debugInstance.toggle(),

  // Category management
  enableCategory: (category: DebugCategory) => debugInstance.enableCategory(category),
  disableCategory: (category: DebugCategory) => debugInstance.disableCategory(category),
  enableAllCategories: () => debugInstance.enableAllCategories(),
  disableAllCategories: () => debugInstance.disableAllCategories(),

  // Log management
  getLogs: () => debugInstance.getLogs(),
  clearLogs: () => debugInstance.clearLogs(),
  exportLogs: () => debugInstance.exportLogs(),

  // Status
  getStatus: () => debugInstance.getStatus(),
  showHelp: () => debugInstance.showHelp(),
  isEnabled: (category?: DebugCategory) => debugInstance.isEnabled(category),
};

// Export class and types for advanced usage
export { DebugManager };