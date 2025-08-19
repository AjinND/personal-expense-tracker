// src/components/dashboard/ExpenseDashboard.tsx
"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShoppingBag, Utensils, Plane, Music } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { QuickStats } from './QuickStats';
import { ExpenseSummary } from './ExpenseSummary';
import { CategoryCards } from './CategoryCards';
import { DashboardCharts } from './DashboardCharts';
import { RecentTransactions } from './RecentTransactions';
import { BudgetProgress } from './BudgetProgress';
import { useDashboard } from '@/hooks/useDashboard';
import { User } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ExpenseDashboardProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

// Map category names to icons
const categoryIcons = {
  food: Utensils,
  shopping: ShoppingBag,
  travelling: Plane,
  entertainment: Music,
};

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({
  user,
  onLogout,
  className
}) => {
  const {
    expenseData,
    loading,
    error,
    refreshing,
    totalBalance,
    metrics,
    refreshData,
    addExpense,
    updateBudget,
    retryOperation,
    dateRange,
    setDateRange,
  } = useDashboard({ onLogout });

  // Calculate additional metrics for QuickStats
  const getTopCategory = () => {
    const categories = [
      { name: 'food', amount: metrics.categoryTotals.food, icon: categoryIcons.food },
      { name: 'shopping', amount: metrics.categoryTotals.shopping, icon: categoryIcons.shopping },
      { name: 'travelling', amount: metrics.categoryTotals.travelling, icon: categoryIcons.travelling },
      { name: 'entertainment', amount: metrics.categoryTotals.entertainment, icon: categoryIcons.entertainment },
    ];
    
    return categories.reduce((max, cat) => cat.amount > max.amount ? cat : max);
  };

  // Calculate monthly change (mock data for now)
  const monthlyChange = -12.5; // This should be calculated from actual data

  // Get current date info for budget progress
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <DashboardHeader
          user={user}
          onRefresh={refreshData}
          refreshing={refreshing}
          error={error}
          onRetry={retryOperation}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <QuickStats
          totalExpenses={metrics.totalExpenses}
          monthlyBudget={totalBalance}
          topCategory={getTopCategory()}
          monthlyChange={monthlyChange}
          loading={loading || refreshing}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expense Summary */}
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
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Budget Progress */}
            <BudgetProgress
              totalExpenses={metrics.totalExpenses}
              monthlyBudget={totalBalance}
              daysInMonth={daysInMonth}
              currentDay={currentDay}
              onEditBudget={() => {
                // This should open a modal or navigate to budget page
                window.location.href = '/budget';
              }}
              loading={refreshing}
            />

            {/* Recent Transactions */}
            <RecentTransactions
              expenses={expenseData}
              loading={refreshing}
              limit={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;