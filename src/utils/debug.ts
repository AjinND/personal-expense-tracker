// src/utils/debug.ts
/**
 * Centralized Debug System
 * - Only works in development environment
 * - Can be toggled on/off via localStorage or environment variable
 * - Organized debug categories for different parts of the app
 */

type DebugCategory = 
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

class DebugManager {
  private static instance: DebugManager;
  private config: DebugConfig;
  private logs: DebugLogEntry[] = [];
  private readonly STORAGE_KEY = 'expense_tracker_debug';
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {
    this.config = this.loadConfig();
    
    // Only setup in development
    if (this.isDevelopment) {
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

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      // Server-side: use environment variables only
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

  // Save debug configuration
  private saveConfig(): void {
    if (!this.isDevelopment || typeof window === 'undefined') return;

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

  // Setup global debugger functions
  private setupGlobalDebugger(): void {
    // Only setup in browser environment
    if (typeof window === 'undefined') return;

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
      getLogs: () => this.getLogs(),
      clearLogs: () => this.clearLogs(),
      exportLogs: () => this.exportLogs(),
      
      // Status
      status: () => this.getStatus(),
      help: () => this.showHelp(),
    };

    console.log('%c🐛 Debug System Available', 'color: #10B981; font-weight: bold;');
    console.log('Type %cdebug.help()%c for available commands', 'color: #3B82F6; font-family: monospace;', '');
  }

  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor navigation timing
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.perf('page_load', 'Page Load Timing', {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              totalTime: navigation.loadEventEnd - navigation.navigationStart,
            });
          }
        }, 0);
      });
    }
  }

  // Core logging method
  private log(
    category: DebugCategory,
    level: 'log' | 'warn' | 'error' | 'info',
    message: string,
    data?: any
  ): void {
    // Only log in development
    if (!this.isDevelopment) return;

    // Check if debug is enabled and category is active
    if (!this.config.enabled || !this.config.categories.has(category)) {
      return;
    }

    const entry: DebugLogEntry = {
      timestamp: Date.now(),
      category,
      level,
      message,
      data,
      stackTrace: this.config.showStackTrace ? new Error().stack : undefined,
    };

    // Store log entry
    if (this.config.persistLogs) {
      this.logs.push(entry);
      
      // Trim logs if exceeding max
      if (this.logs.length > this.config.maxLogs) {
        this.logs = this.logs.slice(-this.config.maxLogs);
      }
    }

    // Format and output to console
    const timestamp = this.config.showTimestamps 
      ? new Date(entry.timestamp).toISOString().substr(11, 12) 
      : '';
    
    const categoryBadge = `[${category.toUpperCase()}]`;
    const prefix = `${timestamp} ${categoryBadge}`.trim();

    // Category-specific colors and icons
    const categoryStyles = this.getCategoryStyles(category);
    
    const consoleMethod = console[level] || console.log;
    
    if (data !== undefined) {
      consoleMethod(
        `%c${categoryStyles.icon}%c ${prefix} %c${message}`,
        categoryStyles.iconStyle,
        categoryStyles.prefixStyle,
        categoryStyles.messageStyle,
        data
      );
    } else {
      consoleMethod(
        `%c${categoryStyles.icon}%c ${prefix} %c${message}`,
        categoryStyles.iconStyle,
        categoryStyles.prefixStyle,
        categoryStyles.messageStyle
      );
    }

    // Show stack trace if enabled
    if (this.config.showStackTrace && entry.stackTrace && level === 'error') {
      console.groupCollapsed('Stack Trace');
      console.log(entry.stackTrace);
      console.groupEnd();
    }
  }

  // Get category-specific styling
  private getCategoryStyles(category: DebugCategory) {
    const styles = {
      api: {
        icon: '🌐',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #3B82F6; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      auth: {
        icon: '🔐',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #EF4444; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      dashboard: {
        icon: '📊',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #10B981; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      navigation: {
        icon: '🧭',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #8B5CF6; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      ui: {
        icon: '🎨',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #F59E0B; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      storage: {
        icon: '💾',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #06B6D4; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      performance: {
        icon: '⚡',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #F97316; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      fallback: {
        icon: '🔧',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #EAB308; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      },
      general: {
        icon: '🐛',
        iconStyle: 'font-size: 14px;',
        prefixStyle: 'color: #6B7280; font-weight: bold;',
        messageStyle: 'color: #1F2937;'
      }
    };

    return styles[category] || styles.general;
  }

  // Public API methods
  public enable(): void {
    if (!this.isDevelopment || typeof window === 'undefined') return;
    this.config.enabled = true;
    this.saveConfig();
    console.log('🐛 Debug mode enabled');
  }

  public disable(): void {
    if (!this.isDevelopment || typeof window === 'undefined') return;
    this.config.enabled = false;
    this.saveConfig();
    console.log('🐛 Debug mode disabled');
  }

  public toggle(): boolean {
    if (!this.isDevelopment || typeof window === 'undefined') return false;
    this.config.enabled = !this.config.enabled;
    this.saveConfig();
    console.log(`🐛 Debug mode ${this.config.enabled ? 'enabled' : 'disabled'}`);
    return this.config.enabled;
  }

  public enableCategory(category: DebugCategory): void {
    if (!this.isDevelopment) return;
    this.config.categories.add(category);
    this.saveConfig();
    if (typeof window !== 'undefined') {
      console.log(`🐛 Debug category '${category}' enabled`);
    }
  }

  public disableCategory(category: DebugCategory): void {
    if (!this.isDevelopment) return;
    this.config.categories.delete(category);
    this.saveConfig();
    if (typeof window !== 'undefined') {
      console.log(`🐛 Debug category '${category}' disabled`);
    }
  }

  public enableAllCategories(): void {
    if (!this.isDevelopment) return;
    this.config.categories = new Set(['api', 'auth', 'dashboard', 'navigation', 'ui', 'storage', 'performance', 'fallback', 'general']);
    this.saveConfig();
    if (typeof window !== 'undefined') {
      console.log('🐛 All debug categories enabled');
    }
  }

  public disableAllCategories(): void {
    if (!this.isDevelopment) return;
    this.config.categories.clear();
    this.saveConfig();
    if (typeof window !== 'undefined') {
      console.log('🐛 All debug categories disabled');
    }
  }

  public getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    if (!this.isDevelopment) return;
    this.logs = [];
    if (typeof window !== 'undefined') {
      console.log('🐛 Debug logs cleared');
    }
  }

  public exportLogs(): void {
    if (!this.isDevelopment || typeof window === 'undefined') return;
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().substr(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public getStatus(): object {
    return {
      enabled: this.config.enabled,
      environment: this.isDevelopment ? 'development' : 'production',
      categories: Array.from(this.config.categories),
      totalLogs: this.logs.length,
      config: this.config,
    };
  }

  public showHelp(): void {
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
    console.log('  debug.getLogs()             - Get all debug logs');
    console.log('  debug.clearLogs()           - Clear debug logs');
    console.log('  debug.exportLogs()          - Export logs to file');
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

// Export singleton instance
export const debug = DebugManager.getInstance();

// Export types for use in other files
export type { DebugCategory };
export { DebugManager };