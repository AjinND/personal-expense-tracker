// src/app/budget/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ExpenseSummary } from '@/components/dashboard/ExpenseSummary';
import { useDashboard } from '@/hooks/useDashboard';
import { User } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';

export default function BudgetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <DashboardLayout user={user || { name: '', email: '' }} onLogout={handleLogout}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <BudgetPageContent user={user} onLogout={handleLogout} />;
}

function BudgetPageContent({ user, onLogout }: { user: User; onLogout: () => void }) {
  // Use existing dashboard hook for data
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
  } = useDashboard({ onLogout });

  const [isEditingBudget, setIsEditingBudget] = useState(false);

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

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={onLogout}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Reuse DashboardHeader */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Planning</h1>
            <p className="text-gray-600">Track and manage your monthly budget</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-sm px-3 py-1", budgetStatus.color)}
          >
            {budgetStatus.text}
          </Badge>
        </div>

        {/* Reuse ExpenseSummary component */}
        <ExpenseSummary
          metrics={metrics}
          totalBalance={totalBalance}
          onBudgetUpdate={updateBudget}
          loading={refreshing}
        />

        {/* Additional Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Budget Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Spent: {formatCurrency(metrics.totalExpenses)}</span>
                <span>Budget: {formatCurrency(totalBalance)}</span>
              </div>
              <Progress value={budgetPercentage} className="h-4" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>{budgetPercentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
              
              {metrics.remainingBudget < 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Budget Exceeded</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    You've spent {formatCurrency(Math.abs(metrics.remainingBudget))} more than your monthly budget.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reuse CategoryCards for budget tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Category Budgets</CardTitle>
            <p className="text-sm text-gray-600">Track spending by category</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(metrics.categoryTotals).map(([category, amount]) => {
                const budgetAmount = category === 'food' ? 800 : 
                                   category === 'shopping' ? 500 : 
                                   category === 'travelling' ? 300 : 200;
                const percentage = (amount / budgetAmount) * 100;
                const isOverBudget = percentage > 100;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{category}</span>
                      <div className="text-right">
                        <span className={cn(
                          "font-medium",
                          isOverBudget ? "text-red-600" : "text-gray-900"
                        )}>
                          {formatCurrency(amount)}
                        </span>
                        <span className="text-gray-500"> / {formatCurrency(budgetAmount)}</span>
                      </div>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{percentage.toFixed(1)}% used</span>
                      <span>
                        {budgetAmount - amount >= 0 
                          ? `${formatCurrency(budgetAmount - amount)} remaining`
                          : `${formatCurrency(Math.abs(budgetAmount - amount))} over`
                        }
                      </span>
                    </div>
                    {isOverBudget && (
                      <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        ⚠️ Over budget by {formatCurrency(amount - budgetAmount)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">✓ Good Practices</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Track expenses daily</li>
                  <li>• Set realistic budget limits</li>
                  <li>• Review and adjust monthly</li>
                  <li>• Plan for unexpected expenses</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">💡 Saving Tips</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Cook meals at home more often</li>
                  <li>• Compare prices before shopping</li>
                  <li>• Use public transportation</li>
                  <li>• Look for free entertainment options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}