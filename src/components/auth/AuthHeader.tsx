// src/components/auth/AuthHeader.tsx
"use client";

import React from 'react';
import { TrendingUp, DollarSign, PieChart, Target } from 'lucide-react';
import { AuthMode } from '@/types/auth';
import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  mode: AuthMode;
  onModeChange: () => void;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  mode,
  onModeChange,
  className,
}) => {
  return (
    <div className={cn('text-center space-y-6', className)}>
      {/* Logo and Brand */}
      <div className="flex items-center justify-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <TrendingUp className="h-3 w-3 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-sm text-gray-600">Smart Financial Management</p>
        </div>
      </div>

      {/* Mode-specific content */}
      <div className="space-y-4">
        {mode === 'login' ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome Back!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Sign in to your account to continue tracking your expenses and managing your budget effectively.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Your Account
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Join thousands of users who are taking control of their finances with our smart expense tracking tools.
            </p>
          </>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mt-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600">Analytics</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Budgets</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600">Insights</p>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          {' '}
          <button
            onClick={onModeChange}
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};