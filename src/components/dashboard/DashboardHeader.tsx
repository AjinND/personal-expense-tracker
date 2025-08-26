// src/components/dashboard/DashboardHeader.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardHeaderProps } from '@/types/dashboard';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onRefresh,
  refreshing,
  error,
  onRetry,
  className,
}) => {
  const getCurrentGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </span>
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 animate-pulse" />
            </div>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            {getCurrentGreeting()}, <span className="font-medium">{user.name}</span>! 
            Track your expenses, manage your budget, and take control of your financial future.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
          >
            <RefreshCw 
              className={cn(
                'h-4 w-4',
                refreshing && 'animate-spin'
              )} 
            />
            <span className="hidden sm:inline">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="ml-4 h-7 px-3 text-xs border-red-300 hover:bg-red-100"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-600 font-medium">Active Session</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800">Online</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-green-600 font-medium">Data Status</p>
              <p className="text-lg sm:text-xl font-bold text-green-800">Synced</p>
            </div>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Last Updated</p>
              <p className="text-sm sm:text-base font-bold text-purple-800">Just Now</p>
            </div>
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 sm:p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-orange-600 font-medium">Security</p>
              <p className="text-lg sm:text-xl font-bold text-orange-800">Secure</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};