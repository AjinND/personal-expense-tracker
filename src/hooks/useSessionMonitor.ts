// src/hooks/useSessionMonitor.ts
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/constants/dashboard';

interface SessionMonitorOptions {
  /** How often to check session validity (in milliseconds) */
  checkInterval?: number;
  /** Enable automatic session refresh */
  autoRefresh?: boolean;
  /** Show warnings before session expires */
  enableWarnings?: boolean;
  /** Warning time before session expires (in milliseconds) */
  warningTime?: number;
}

interface SessionStatus {
  isValid: boolean;
  expiresAt?: number;
  lastChecked: number;
  isRefreshing: boolean;
}

export const useSessionMonitor = (options: SessionMonitorOptions = {}) => {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes
    autoRefresh = true,
    enableWarnings = true,
    warningTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { user, refreshSession, logout } = useAuth();
  const router = useRouter();
  
  const sessionStatusRef = useRef<SessionStatus>({
    isValid: !!user,
    lastChecked: Date.now(),
    isRefreshing: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  // Parse JWT to get expiration time
  const getTokenExpiration = useCallback((): number | null => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.warn('Failed to parse token:', error);
      return null;
    }
  }, []);

  // Check if session is about to expire
  const isSessionExpiringSoon = useCallback((): boolean => {
    const expiresAt = getTokenExpiration();
    if (!expiresAt) return false;

    const now = Date.now();
    return (expiresAt - now) <= warningTime && (expiresAt - now) > 0;
  }, [getTokenExpiration, warningTime]);

  // Check if session is expired
  const isSessionExpired = useCallback((): boolean => {
    const expiresAt = getTokenExpiration();
    if (!expiresAt) return false;

    return Date.now() >= expiresAt;
  }, [getTokenExpiration]);

  // Show session warning
  const showSessionWarning = useCallback(() => {
    if (warningShownRef.current) return;
    warningShownRef.current = true;

    const remainingTime = Math.floor((getTokenExpiration()! - Date.now()) / 1000 / 60);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Expiring', {
        body: `Your session will expire in ${remainingTime} minutes. Please save your work.`,
        icon: '/favicon.ico',
      });
    } else {
      // Fallback to console warning or custom notification
      console.warn(`Session expiring in ${remainingTime} minutes`);
    }
  }, [getTokenExpiration]);

  // Handle session refresh
  const handleSessionRefresh = useCallback(async () => {
    if (sessionStatusRef.current.isRefreshing) return;

    sessionStatusRef.current.isRefreshing = true;
    
    try {
      await refreshSession();
      sessionStatusRef.current.isValid = true;
      sessionStatusRef.current.lastChecked = Date.now();
      warningShownRef.current = false; // Reset warning flag
    } catch (error) {
      console.error('Session refresh failed:', error);
      sessionStatusRef.current.isValid = false;
      logout();
    } finally {
      sessionStatusRef.current.isRefreshing = false;
    }
  }, [refreshSession, logout]);

  // Main session check function
  const checkSession = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    sessionStatusRef.current.lastChecked = now;

    // Check if token is expired
    if (isSessionExpired()) {
      console.warn('Session expired, logging out...');
      logout();
      return;
    }

    // Check if session is expiring soon
    if (enableWarnings && isSessionExpiringSoon()) {
      showSessionWarning();
      
      // Auto-refresh if enabled
      if (autoRefresh) {
        await handleSessionRefresh();
      }
    }
  }, [
    user,
    isSessionExpired,
    isSessionExpiringSoon,
    enableWarnings,
    showSessionWarning,
    autoRefresh,
    handleSessionRefresh,
    logout,
  ]);

  // Start session monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial check
    checkSession();

    // Set up interval
    intervalRef.current = setInterval(checkSession, checkInterval);
  }, [checkSession, checkInterval]);

  // Stop session monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Effect to start/stop monitoring based on user state
  useEffect(() => {
    if (user) {
      startMonitoring();
      requestNotificationPermission();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [user, startMonitoring, stopMonitoring, requestNotificationPermission]);

  // Effect to handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Check session immediately when user returns to tab
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkSession]);

  // Effect to handle beforeunload (warn user about unsaved changes)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSessionExpiringSoon()) {
        event.preventDefault();
        event.returnValue = 'Your session is about to expire. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSessionExpiringSoon]);

  // Return session status and control functions
  return {
    sessionStatus: sessionStatusRef.current,
    isSessionValid: sessionStatusRef.current.isValid,
    isSessionExpiring: isSessionExpiringSoon(),
    isSessionExpired: isSessionExpired(),
    timeUntilExpiry: (() => {
      const expiresAt = getTokenExpiration();
      return expiresAt ? Math.max(0, expiresAt - Date.now()) : null;
    })(),
    refreshSession: handleSessionRefresh,
    startMonitoring,
    stopMonitoring,
    checkSession,
  };
};