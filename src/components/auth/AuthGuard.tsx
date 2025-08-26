// src/components/auth/AuthGuard.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { STORAGE_KEYS } from '@/constants/dashboard';
import { AuthContextType, AuthUser } from '@/types/auth-backend';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

// Create Auth Context
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshSession: async () => {},
});

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthGuard');
  }
  return context;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent multiple concurrent requests and handle cleanup
  const sessionValidationRef = useRef<Promise<void> | null>(null);
  const isComponentMountedRef = useRef(true);
  const lastValidationTimeRef = useRef<number>(0);
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Session validation with debouncing and error handling
  const validateSession = useCallback(async (forceRefresh = false) => {
    // Prevent multiple concurrent validation requests
    if (sessionValidationRef.current && !forceRefresh) {
      return sessionValidationRef.current;
    }
    
    // Debounce rapid session validations (prevent within 30 seconds unless forced)
    const now = Date.now();
    if (!forceRefresh && (now - lastValidationTimeRef.current) < 30000) {
      return;
    }
    
    const validationPromise = (async () => {
      if (!isComponentMountedRef.current) return;
      
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        if (isComponentMountedRef.current) {
          setLoading(false);
          if (requireAuth && !isPublicRoute) {
            router.push('/login');
          }
        }
        return;
      }

      try {
        const response = await axios.post(
          '/api/auth/session',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          }
        );

        if (!isComponentMountedRef.current) return;

        if (response.data.success) {
          const userData = response.data.userData;
          const authUser: AuthUser = {
            id: userData.id || userData._id || '',
            name: userData.name || '',
            email: userData.email || '',
            monthlyBudget: userData.monthlyBudget || 0,
            avatar: userData.avatar || '',
          };
          
          setUser(authUser);
          setError(null);
          lastValidationTimeRef.current = now;
          
          // Redirect to dashboard if on login page
          if (isPublicRoute && requireAuth) {
            router.push('/dashboard');
          }
        } else {
          handleAuthError(response.data.error || 'Session validation failed');
        }
      } catch (error) {
        if (!isComponentMountedRef.current) return;
        
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (error.code === 'ECONNABORTED') {
            setError('Connection timeout. Please check your internet connection.');
          } else if (status === 401) {
            handleAuthError('Session expired. Please login again.');
          } else if (status === 429) {
            // Rate limited - wait and retry
            console.warn('Rate limited, retrying in 5 seconds...');
            setTimeout(() => {
              if (isComponentMountedRef.current) {
                validateSession(true);
              }
            }, 5000);
            return;
          } else if (typeof status === 'number' && status >= 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(error.response?.data?.error || 'Failed to validate session');
          }
        } else {
          setError('Network error. Please check your connection.');
        }
      } finally {
        if (isComponentMountedRef.current) {
          setLoading(false);
        }
      }
    })();
    
    sessionValidationRef.current = validationPromise;
    return validationPromise;
  }, [requireAuth, isPublicRoute, router]);

  const handleAuthError = useCallback((errorMessage: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(errorMessage);
    
    if (requireAuth && !isPublicRoute) {
      router.push('/login');
    }
  }, [requireAuth, isPublicRoute, router]);

  const login = useCallback((userData: AuthUser, token: string) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setError(null);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const refreshSession = useCallback(async () => {
    await validateSession(true);
  }, [validateSession]);

  // Effect for initial session validation
  useEffect(() => {
    isComponentMountedRef.current = true;
    validateSession();
    
    return () => {
      isComponentMountedRef.current = false;
    };
  }, [validateSession]);

  // Effect for pathname changes - validate session on navigation
  useEffect(() => {
    if (isComponentMountedRef.current && user) {
      // Only validate if we have a user and it's been more than 30 seconds
      const now = Date.now();
      if ((now - lastValidationTimeRef.current) > 30000) {
        validateSession();
      }
    }
  }, [pathname, user, validateSession]);

  // Effect for handling visibility changes (when user comes back to the tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isComponentMountedRef.current) {
        const now = Date.now();
        // If it's been more than 5 minutes since last validation, refresh
        if ((now - lastValidationTimeRef.current) > 300000) {
          validateSession(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, validateSession]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error and no user
  if (error && !user && requireAuth && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              validateSession(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // For public routes, show content if no user or if user exists
  if (!requireAuth || isPublicRoute) {
    return (
      <AuthContext.Provider value={{ 
        user, 
        loading, 
        error, 
        login, 
        logout, 
        updateUser, 
        refreshSession 
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // For protected routes, only show content if user exists
  if (!user) {
    return null; // Router will handle redirect
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      updateUser, 
      refreshSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthGuard;