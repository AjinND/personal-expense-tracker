// src/components/dashboard/ExpenseDashboard.tsx
"use client";

import React, { useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Utensils, ShoppingBag, Plane, Music, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseSummary } from './ExpenseSummary';
import { CategoryCards } from './CategoryCards';
import { DashboardCharts } from './DashboardCharts';
import { RecentTransactions } from './RecentTransactions';
import { DashboardLayoutConfig, useDashboardConfig } from './DashboardLayoutConfig';
import { useDashboard } from '@/hooks/useDashboard';
import { User } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { 
  calculateMonthlyChange, 
  getTopCategory, 
  getSpendingInsights,
  sanitizeExpenseData 
} from '@/lib/dashboard-analytics';

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
  const { config, updateConfig } = useDashboardConfig();
  
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

  // Sanitize expense data to remove any mock/hardcoded values
  const cleanExpenseData = useMemo(() => 
    sanitizeExpenseData(expenseData), [expenseData]
  );

  // Calculate real metrics from actual data
  const calculatedMetrics = useMemo(() => {
    const monthlyChange = calculateMonthlyChange(cleanExpenseData);
    const topCategory = getTopCategory(metrics.categoryTotals);
    const insights = getSpendingInsights(cleanExpenseData, totalBalance, metrics.categoryTotals);
    
    return {
      monthlyChange,
      topCategory: {
        ...topCategory,
        icon: categoryIcons[topCategory.category]
      },
      insights
    };
  }, [cleanExpenseData, metrics.categoryTotals, totalBalance]);

  // Show loading state for the entire dashboard
  if (loading && !cleanExpenseData.length) {
    return (
      <div className={cn("min-h-screen bg-gray-50 flex items-center justify-center", className)}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto">
            <RefreshCw className="h-6 w-6" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
        config.compactMode ? "space-y-4" : "space-y-8"
      )}>
        
        {/* Header with Layout Configuration */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your financial overview for {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <DashboardLayoutConfig
              config={config}
              onConfigChange={updateConfig}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </Button>
          </div>
        </div>

        {/* Error Alert - Only show if there's an error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <button 
                onClick={retryOperation}
                className="ml-2 underline hover:no-underline font-medium"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Smart Insights - Show important alerts first */}
        {config.showInsights && calculatedMetrics.insights.insights.length > 0 && (
          <div className="space-y-3">
            {calculatedMetrics.insights.insights.slice(0, 2).map((insight, index) => (
              <Alert 
                key={index}
                variant={insight.type === 'error' ? 'destructive' : 'default'}
                className={cn(
                  insight.type === 'success' && "border-green-200 bg-green-50",
                  insight.type === 'warning' && "border-yellow-200 bg-yellow-50",
                  insight.type === 'info' && "border-blue-200 bg-blue-50"
                )}
              >
                <AlertDescription>
                  <span className="font-medium">{insight.title}:</span> {insight.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Main Content - Responsive Grid */}
        <div className="space-y-8">
          
          {/* Financial Overview */}
          {config.showQuickStats && (
            <ExpenseSummary
              metrics={metrics}
              totalBalance={totalBalance}
              onBudgetUpdate={updateBudget}
              loading={refreshing}
              monthlyChange={calculatedMetrics.monthlyChange}
              topCategory={calculatedMetrics.topCategory}
            />
          )}

          {/* Category Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Expense Categories</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click any category to add an expense
                </p>
              </div>
            </div>
            <CategoryCards
              categoryTotals={metrics.categoryTotals}
              onAddExpense={addExpense}
              loading={refreshing}
            />
          </div>

          {/* Charts Section - ALWAYS show if enabled and there's data */}
          {config.showCharts && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Visual breakdown of your spending patterns
                  </p>
                </div>
              </div>
              
              {/* Show charts even with minimal data */}
              <DashboardCharts
                expenses={expenseData} // Use original data, not just cleaned
                categoryTotals={metrics.categoryTotals}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                loading={refreshing}
              />
            </div>
          )}

          {/* Recent Transactions - Side by side with charts OR standalone */}
          {config.showRecentTransactions && expenseData.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Your latest transactions
                  </p>
                </div>
              </div>
              
              <RecentTransactions
                expenses={expenseData} // Use original data
                loading={refreshing}
                limit={config.compactMode ? 5 : 8}
              />
            </div>
          )}

          {/* Empty State - Show if no data */}
          {!loading && expenseData.length === 0 && (
            <div className="text-center py-16 space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Utensils className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Welcome to Expense Tracker!
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Start tracking your expenses by clicking on any category above to add your first expense.
                </p>
                <div className="flex items-center justify-center space-x-4 pt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Food</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Shopping</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Travel</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Entertainment</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;