// src/app/(auth)/budget/page.tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { ExpenseSummary } from '@/components/dashboard/ExpenseSummary';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  PiggyBank,
  Calculator,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '@/constants/dashboard';

export default function BudgetPage() {
  const { user, logout } = useAuth();
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const {
    expenseData,
    loading,
    error,
    refreshing,
    totalBalance,
    metrics,
    updateBudget,
    refreshData,
    retryOperation,
  } = useDashboard({ onLogout: logout });

  if (!user) return null;

  const getBudgetStatus = () => {
    const percentage = (metrics.totalExpenses / totalBalance) * 100;
    
    if (percentage >= 100) {
      return { status: 'over', color: 'text-red-600', text: 'Over Budget' };
    } else if (percentage >= 80) {
      return { status: 'warning', color: 'text-yellow-600', text: 'Budget Warning' };
    } else {
      return { status: 'good', color: 'text-green-600', text: 'On Track' };
    }
  };

  const budgetStatus = getBudgetStatus();
  const budgetPercentage = Math.min((metrics.totalExpenses / totalBalance) * 100, 100);

  // Get current date info
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;

  // Calculate daily averages
  const dailyAverage = metrics.totalExpenses / currentDay;
  const projectedMonthlyTotal = dailyAverage * daysInMonth;
  const recommendedDailyBudget = totalBalance / daysInMonth;

  // Category budgets (for now, split equally - in real app, these would be customizable)
  const categoryBudgets = {
    food: totalBalance * 0.35,
    shopping: totalBalance * 0.25,
    travelling: totalBalance * 0.20,
    entertainment: totalBalance * 0.20,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Planning</h1>
          <p className="text-gray-600">Track and manage your monthly budget</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("", budgetStatus.color)}>
            {budgetStatus.text}
          </Badge>
          <Button onClick={refreshData} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Main Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress - Full Width on Mobile */}
        <div className="lg:col-span-2">
          <BudgetProgress
            totalExpenses={metrics.totalExpenses}
            monthlyBudget={totalBalance}
            daysInMonth={daysInMonth}
            currentDay={currentDay}
            onEditBudget={() => setIsEditingBudget(true)}
            loading={loading || refreshing}
          />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <PiggyBank className="h-8 w-8 text-green-600" />
                <span className="text-sm text-gray-500">Savings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(Math.max(0, totalBalance - metrics.totalExpenses))}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {((Math.max(0, totalBalance - metrics.totalExpenses) / totalBalance) * 100).toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="text-sm text-gray-500">Days Left</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{daysRemaining}</p>
              <p className="text-sm text-gray-600 mt-1">
                in current month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense Summary */}
      <ExpenseSummary
        metrics={metrics}
        totalBalance={totalBalance}
        onBudgetUpdate={updateBudget}
        loading={refreshing}
      />

      {/* Category Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Category Budgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categoryBudgets).map(([category, budget]) => {
            const spent = metrics.categoryTotals[category as keyof typeof metrics.categoryTotals];
            const percentage = (spent / budget) * 100;
            const isOver = percentage > 100;

            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}
                    />
                    <span className="font-medium capitalize">{category}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-semibold", isOver && "text-red-600")}>
                      {formatCurrency(spent)}
                    </span>
                    <span className="text-gray-500"> / {formatCurrency(budget)}</span>
                  </div>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={cn(
                    "h-2",
                    isOver && "[&>div]:bg-red-500"
                  )}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{percentage.toFixed(1)}% used</span>
                  <span>{formatCurrency(Math.max(0, budget - spent))} remaining</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Budget Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Spending Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Daily Average</span>
              <span className="font-semibold">{formatCurrency(dailyAverage)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Recommended Daily</span>
              <span className="font-semibold">{formatCurrency(recommendedDailyBudget)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Projected Monthly</span>
              <span className={cn(
                "font-semibold",
                projectedMonthlyTotal > totalBalance && "text-red-600"
              )}>
                {formatCurrency(projectedMonthlyTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Budget Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetStatus.status === 'over' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Budget Exceeded
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Reduce spending to avoid overspending this month
                  </p>
                </div>
              )}
              {budgetStatus.status === 'warning' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Spending Fast
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    You're spending faster than planned. Consider slowing down.
                  </p>
                </div>
              )}
              {budgetStatus.status === 'good' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Great job! You're on track with your budget.
                  </p>
                </div>
              )}
              
              {/* Top spending category alert */}
              {(() => {
                const topCategory = Object.entries(metrics.categoryTotals)
                  .sort(([,a], [,b]) => b - a)[0];
                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Highest spending: {topCategory[0]}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formatCurrency(topCategory[1])} spent this month
                    </p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}