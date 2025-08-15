// src/components/auth/AuthHeader.tsx
"use client";

import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import { AuthMode } from '@/types/auth';
import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  mode: AuthMode;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ mode, className }) => {
  const isLogin = mode === 'login';

  return (
    <div className={cn('text-center space-y-4', className)}>
      {/* Logo */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          {!isLogin && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-yellow-800" />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {isLogin ? 'Welcome Back!' : 'Get Started'}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          {isLogin
            ? 'Sign in to your account to continue tracking your expenses and managing your budget.'
            : 'Create your account to start tracking expenses, setting budgets, and taking control of your finances.'
          }
        </p>
      </div>

      {/* Features highlight (only for register) */}
      {!isLogin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-blue-600 text-lg">📊</span>
            </div>
            <p className="text-sm text-gray-600">Track Expenses</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-lg">💰</span>
            </div>
            <p className="text-sm text-gray-600">Set Budgets</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-purple-600 text-lg">📈</span>
            </div>
            <p className="text-sm text-gray-600">View Insights</p>
          </div>
        </div>
      )}
    </div>
  );
};