// src/components/dashboard/ExpenseDashboard.tsx
"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Navigation from '@/components/navigation/navBar';
import { DashboardHeader } from './DashboardHeader';
import { ExpenseSummary } from './ExpenseSummary';
import { CategoryCards } from './CategoryCards';
import { DashboardCharts } from './DashboardCharts';
import { useDashboard, useChartData } from '@/hooks/useDashboard';
import { User } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ExpenseDashboardProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

// Loading skeleton component
const DashboardSkeleton: React.FC = () => (
  <div className="container mx-auto p-4 sm:p-6 space-y-6">
    {/* Header skeleton */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>

    {/* Summary skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>

    {/* Category cards skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>

    {/* Charts skeleton */}
    <Skeleton className="h-96 w-full" />
  </div>
);

// Error component
const DashboardError: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="container mx-auto p-6">
    <Alert variant="destructive" className="max-w-2xl mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={onRetry}
          className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </AlertDescription>
    </Alert>
  </div>
);

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({
  user,
  onLogout,
  className,
}) => {
  // Use custom dashboard hook
  const {
    expenseData,
    loading,
    error,
    refreshing,
    dateRange,
    totalBalance,
    metrics,
    addExpense,
    updateBudget,
    refreshData,
    setDateRange,
    retryOperation,
  } = useDashboard({ onLogout });

  // Use chart data hook
  const chartData = useChartData(expenseData, dateRange);

  // Handle critical errors
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} onLogout={onLogout} />
        <DashboardError error={error} onRetry={retryOperation} />
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} onLogout={onLogout} />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <Navigation user={user} onLogout={onLogout} />

      <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader
          user={user}
          onRefresh={refreshData}
          refreshing={refreshing}
          error={error}
          onRetry={retryOperation}
        />

        {/* Expense Summary Cards */}
        <ExpenseSummary
          metrics={metrics}
          totalBalance={totalBalance}
          onBudgetUpdate={updateBudget}
          loading={refreshing}
        />

        {/* Category Cards */}
        <CategoryCards
          categoryTotals={metrics.categoryTotals}
          onAddExpense={addExpense}
          loading={refreshing}
        />

        {/* Charts Section */}
        <DashboardCharts
          expenses={expenseData}
          categoryTotals={metrics.categoryTotals}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          loading={refreshing}
        />

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm border-t border-gray-200">
          <div className="space-y-2">
            <p>© 2024 Expense Tracker. Built with security and privacy in mind.</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Secure Connection
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Data Encrypted
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Privacy Protected
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ExpenseDashboard;