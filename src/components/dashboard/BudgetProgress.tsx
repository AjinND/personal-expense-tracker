// src/components/dashboard/BudgetProgress.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target,
  AlertTriangle,
  TrendingUp,
  Edit2,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';
import { BudgetProgressProps } from '@/types/dashboard';

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  totalExpenses,
  monthlyBudget,
  daysInMonth,
  currentDay,
  onEditBudget,
  loading = false,
  className
}) => {
  const budgetUsedPercentage = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const timeElapsedPercentage = (currentDay / daysInMonth) * 100;
  const remaining = monthlyBudget - totalExpenses;
  const dailyBudget = monthlyBudget / daysInMonth;
  const suggestedDailySpend = remaining / (daysInMonth - currentDay + 1);
  
  // Determine budget status
  const getBudgetStatus = () => {
    if (budgetUsedPercentage >= 100) {
      return { 
        status: 'exceeded', 
        color: 'text-red-600 bg-red-50', 
        icon: AlertTriangle,
        message: 'Budget Exceeded' 
      };
    } else if (budgetUsedPercentage > timeElapsedPercentage + 10) {
      return { 
        status: 'warning', 
        color: 'text-yellow-600 bg-yellow-50', 
        icon: AlertTriangle,
        message: 'Spending Fast' 
      };
    } else {
      return { 
        status: 'good', 
        color: 'text-green-600 bg-green-50', 
        icon: CheckCircle,
        message: 'On Track' 
      };
    }
  };

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Budget Status</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge className={budgetStatus.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {budgetStatus.message}
          </Badge>
          {onEditBudget && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onEditBudget}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              {formatCurrency(totalExpenses)} of {formatCurrency(monthlyBudget)}
            </span>
            <span className="font-medium">
              {budgetUsedPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={budgetUsedPercentage} 
              className={cn(
                "h-3",
                budgetUsedPercentage >= 100 && "[&>div]:bg-red-500",
                budgetUsedPercentage >= 80 && budgetUsedPercentage < 100 && "[&>div]:bg-yellow-500"
              )}
            />
            {/* Time elapsed indicator */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${timeElapsedPercentage}%` }}
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                Day {currentDay} of {daysInMonth}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Remaining Budget</p>
            <p className={cn(
              "text-lg font-semibold",
              remaining >= 0 ? "text-gray-900" : "text-red-600"
            )}>
              {formatCurrency(Math.abs(remaining))}
              {remaining < 0 && " over"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Suggested Daily</p>
            <p className="text-lg font-semibold text-gray-900">
              {remaining > 0 && (daysInMonth - currentDay + 1) > 0 
                ? formatCurrency(suggestedDailySpend)
                : formatCurrency(0)
              }
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/budget">
            <Target className="h-4 w-4 mr-2" />
            Manage Budget
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;