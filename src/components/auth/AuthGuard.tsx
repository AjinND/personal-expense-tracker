// src/components/auth/AuthGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  monthlyBudget?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (userData: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
}

// Create Auth Context
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
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

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      if (requireAuth && !isPublicRoute) {
        router.push('/login');
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

      if (response.data.success) {
        const userData = response.data.userData;
        const authUser: AuthUser = {
          id: userData.id || userData._id || 'user-id',
          name: userData.name || 'User',
          email: userData.email || 'user@example.com',
          monthlyBudget: userData.monthlyBudget || 0,
        };
        
        setUser(authUser);
        setError(null);
        
        // Redirect to dashboard if on login page
        if (isPublicRoute) {
          router.push('/');
        }
      } else {
        handleAuthError(response.data.error || 'Session validation failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError('Connection timeout. Please check your internet connection.');
        } else if (error.response?.status === 401) {
          handleAuthError('Session expired. Please login again.');
        } else if (error.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(error.response?.data?.error || 'Failed to validate session');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (errorMessage: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(errorMessage);
    
    if (requireAuth && !isPublicRoute) {
      router.push('/login');
    }
  };

  const login = (userData: AuthUser, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setError(null);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (userData: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

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

  // For public routes, show content if no user or if user exists
  if (!requireAuth || isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // For protected routes, only show content if user exists
  if (!user) {
    return null; // Router will handle redirect
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthGuard;