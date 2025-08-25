import { STORAGE_KEYS } from "@/constants/dashboard";

// src/utils/sessionDebug.ts
interface SessionDebugInfo {
  hasToken: boolean;
  tokenFormat: 'valid' | 'invalid' | 'missing';
  tokenExpiry: number | null;
  isExpired: boolean;
  timeUntilExpiry: number | null;
  tokenClaims: any;
  storageKeys: string[];
  apiConnectivity: boolean;
  lastError: string | null;
}

export class SessionDebugger {
  private static instance: SessionDebugger;
  private debugHistory: Array<{ timestamp: number; event: string; data: any }> = [];

  static getInstance(): SessionDebugger {
    if (!SessionDebugger.instance) {
      SessionDebugger.instance = new SessionDebugger();
    }
    return SessionDebugger.instance;
  }

  // Log session events for debugging
  logEvent(event: string, data?: any): void {
    this.debugHistory.push({
      timestamp: Date.now(),
      event,
      data: data || {},
    });

    // Keep only last 50 events
    if (this.debugHistory.length > 50) {
      this.debugHistory = this.debugHistory.slice(-50);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Session Debug - ${event}:`, data);
    }
  }

  // Get comprehensive session debug information
  async getDebugInfo(): Promise<SessionDebugInfo> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
    let tokenClaims;
    let tokenExpiry;
    let isExpired = false;
    let timeUntilExpiry;
    let tokenFormat: 'valid' | 'invalid' | 'missing' = 'missing';

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          tokenFormat = 'valid';
          tokenClaims = JSON.parse(atob(parts[1]));
          
          if (tokenClaims && tokenClaims.exp) {
            tokenExpiry = tokenClaims.exp * 1000;
            isExpired = Date.now() >= tokenExpiry;
            timeUntilExpiry = tokenExpiry - Date.now();
          }
        } else {
          tokenFormat = 'invalid';
        }
      } catch (error) {
        tokenFormat = 'invalid';
        this.logEvent('token_parse_error', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Check local storage keys
    const storageKeys = typeof window !== 'undefined' 
      ? Object.keys(localStorage).filter(key => 
          key.includes('token') || key.includes('auth') || key.includes('user')
        )
      : [];

    // Test API connectivity
    let apiConnectivity = false;
    let lastError;
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      apiConnectivity = response.ok;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData.error || `HTTP ${response.status}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error';
    }

    return {
      hasToken: !!token,
      tokenFormat,
      tokenExpiry,
      isExpired,
      timeUntilExpiry,
      tokenClaims,
      storageKeys,
      apiConnectivity,
      lastError,
    };
  }

  // Get debug history
  getHistory(): Array<{ timestamp: number; event: string; data: any }> {
    return [...this.debugHistory];
  }

  // Clear debug history
  clearHistory(): void {
    this.debugHistory = [];
  }

  // Generate debug report
  async generateReport(): Promise<string> {
    const info = await this.getDebugInfo();
    const history = this.getHistory();

    return `
# Session Debug Report
Generated: ${new Date().toISOString()}

## Token Status
- Has Token: ${info.hasToken}
- Token Format: ${info.tokenFormat}
- Token Expiry: ${info.tokenExpiry ? new Date(info.tokenExpiry).toISOString() : 'N/A'}
- Is Expired: ${info.isExpired}
- Time Until Expiry: ${info.timeUntilExpiry ? Math.floor(info.timeUntilExpiry / 1000 / 60) + ' minutes' : 'N/A'}

## API Connectivity
- Can Reach API: ${info.apiConnectivity}
- Last Error: ${info.lastError || 'None'}

## Storage Keys
${info.storageKeys.map(key => `- ${key}`).join('\n')}

## Token Claims
${info.tokenClaims ? JSON.stringify(info.tokenClaims, null, 2) : 'No token or invalid format'}

## Recent Events
${history.slice(-10).map(event => 
  `${new Date(event.timestamp).toISOString()}: ${event.event} - ${JSON.stringify(event.data)}`
).join('\n')}
    `.trim();
  }

  // Quick fix attempts
  async quickFix(): Promise<{ success: boolean; actions: string[] }> {
    const actions: string[] = [];
    let success = true;

    try {
      const info = await this.getDebugInfo();

      // Fix 1: Clear invalid tokens
      if (info.hasToken && info.tokenFormat === 'invalid') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          actions.push('Cleared invalid token');
        }
      }

      // Fix 2: Clear expired tokens
      if (info.hasToken && info.isExpired) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          actions.push('Cleared expired token');
        }
      }

      // Fix 3: Clear orphaned storage keys
      if (typeof window !== 'undefined') {
        const orphanedKeys = info.storageKeys.filter(key => 
          key !== 'token' && key !== 'user' && key !== 'user_preferences'
        );
        
        orphanedKeys.forEach(key => {
          localStorage.removeItem(key);
          actions.push(`Cleared orphaned key: ${key}`);
        });
      }

      this.logEvent('quick_fix_completed', { actions });

    } catch (error) {
      success = false;
      actions.push(`Quick fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logEvent('quick_fix_failed', { error });
    }

    return { success, actions };
  }
}

// Export singleton instance
export const sessionDebugger = SessionDebugger.getInstance();

// Development helper functions
export const debugSession = {
  // Quick debug in console
  info: () => sessionDebugger.getDebugInfo(),
  
  // Generate and log full report
  report: async () => {
    const report = await sessionDebugger.generateReport();
    console.log(report);
    return report;
  },
  
  // Attempt quick fixes
  fix: () => sessionDebugger.quickFix(),
  
  // Clear debug history
  clear: () => sessionDebugger.clearHistory(),
  
  // Test specific API endpoint
  testApi: async (endpoint: string = '/api/auth/session') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json().catch(() => ({}));
      
      console.log(`API Test for ${endpoint}:`, {
        status: response.status,
        ok: response.ok,
        data,
      });
      
      return { status: response.status, ok: response.ok, data };
    } catch (error) {
      console.error(`API Test failed for ${endpoint}:`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Make available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).debugSession = debugSession;
}