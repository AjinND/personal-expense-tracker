// src/components/auth/AuthenticationPage.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthForm } from './AuthForm';
import { AuthFormData, AuthResponse, AuthMode, User } from '@/types/auth';
import { STORAGE_KEYS } from '@/constants/dashboard';
import { AuthHeader } from './AuthHeader';

interface AuthenticationPageProps {
  onAuthenticate: (userData: User) => void;
}

export const AuthenticationPage: React.FC<AuthenticationPageProps> = ({
  onAuthenticate,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle authentication API call
  const handleAuthSubmit = async (formData: AuthFormData): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const action = mode;
      const body = {
        action,
        ...formData,
      };

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        // Save token to localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        
        // Show success message
        toast({
          title: mode === 'login' ? 'Welcome back!' : 'Account created!',
          description: data.message || `Successfully ${mode === 'login' ? 'signed in' : 'created your account'}.`,
          duration: 3000,
        });

        // Call onAuthenticate with user data
        onAuthenticate({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          monthlyBudget: data.user.monthlyBudget,
        });

        return { success: true, user: data.user, token: data.token };
      } else {
        // Show error toast
        toast({
          title: 'Authentication Failed',
          description: data.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
          duration: 4000,
        });

        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      const errorMessage = 'Network error. Please check your connection and try again.';
      
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mode toggle
  const handleModeChange = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Header */}
            <AuthHeader mode={mode} onModeChange={handleModeChange} className="mb-8" />

            {/* Form */}
            <AuthForm
              mode={mode}
              onSubmit={handleAuthSubmit}
              onModeChange={handleModeChange}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Private</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Your data is protected with enterprise-grade security and encryption.
            We never share your personal information.
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};