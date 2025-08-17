// src/components/dashboard/ExpenseDashboard.tsx
"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardHeader } from './DashboardHeader';
import { ExpenseSummary } from './ExpenseSummary';
import { CategoryCards } from './CategoryCards';
import { DashboardCharts } from './DashboardCharts';
import { useDashboard, useChartData } from '@/hooks/useDashboard';
import { User } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ExpenseDashboardProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

// Enhanced loading skeleton component
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Quick Stats Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>

    {/* Summary Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>

    {/* Category Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// Enhanced error component
const DashboardError: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center max-w-md mx-auto">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="space-y-3">
        <Button onClick={onRetry} className="w-full">
          Try Again
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()} 
          className="w-full"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  </div>
);

type Stat = {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change: number | null;
};

// Quick stats component
const QuickStats: React.FC<{ 
  metrics: any; 
  totalBalance: number; 
  refreshing: boolean;
  expenseData: any[];
}> = ({
  metrics,
  totalBalance,
  refreshing,
  expenseData
}) => {
  // Calculate transaction count from expense data
  const transactionCount = expenseData.length;
  
  const stats: Stat[] = [
    {
      label: 'Total Spent',
      value: `$${metrics.totalExpenses.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: null, // We don't have historical data to calculate change
    },
    {
      label: 'Monthly Budget',
      value: `$${totalBalance.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null,
    },
    {
      label: 'Remaining',
      value: `$${metrics.remainingBudget.toFixed(2)}`,
      icon: PieChart,
      color: metrics.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100',
      change: null,
    },
    {
      label: 'This Month',
      value: `${transactionCount} expenses`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  refreshing && "animate-pulse"
                )}>
                  {stat.value}
                </p>
                {stat.change !== null && typeof stat.change === 'number' && (
                  <p className={cn(
                    "text-xs mt-1",
                    stat.change >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}% from last month
                  </p>
                )}
              </div>
              <div className={cn("p-3 rounded-full", stat.bgColor)}>
                <Icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
      <DashboardLayout user={user} onLogout={onLogout} className={className}>
        <DashboardError error={error} onRetry={retryOperation} />
      </DashboardLayout>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={onLogout} className={className}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={onLogout} className={className}>
      <div className="space-y-6">
        {/* Error Alert (non-critical errors) */}
        {error && !loading && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                onClick={retryOperation}
                variant="outline"
                size="sm"
                className="ml-4 h-7 px-3 text-xs border-red-300 hover:bg-red-100"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard Header */}
        <DashboardHeader
          user={user}
          onRefresh={refreshData}
          refreshing={refreshing}
          error={error}
          onRetry={retryOperation}
        />

        {/* Quick Stats */}
        <QuickStats 
          metrics={metrics} 
          totalBalance={totalBalance} 
          refreshing={refreshing}
          expenseData={expenseData}
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

        {/* Additional Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {expenseData.length > 0 ? (
              <div className="space-y-3">
                {expenseData.slice(0, 5).map((expense, index) => (
                  <div key={expense._id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Multiple categories
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${(expense.food + expense.shopping + expense.travelling + expense.entertainment).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent expenses</p>
                <p className="text-sm text-gray-400">Start tracking your expenses to see activity here</p>
              </div>
            )}
          </div>

          {/* Budget Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Spent</span>
                  <span className="font-medium">${metrics.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      (metrics.totalExpenses / totalBalance) > 0.9 ? "bg-red-500" :
                      (metrics.totalExpenses / totalBalance) > 0.7 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ 
                      width: `${Math.min((metrics.totalExpenses / totalBalance) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0</span>
                  <span>${totalBalance.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics.remainingBudget.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {metrics.remainingBudget >= 0 ? 'Remaining this month' : 'Over budget'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};