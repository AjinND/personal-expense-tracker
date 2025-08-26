// src/components/dashboard/QuickStats.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ShoppingBag,
  Utensils,
  Plane,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/dashboard-utils';
import { QuickStatsProps } from '@/types/components';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor = "bg-blue-100",
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-full", iconBgColor)}>
            <Icon className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const QuickStats: React.FC<QuickStatsProps> = ({
  totalExpenses,
  monthlyBudget,
  topCategory,
  monthlyChange,
  loading = false,
  className
}) => {
  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const remaining = monthlyBudget - totalExpenses;

  const getCategoryIconBg = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'food':
        return 'bg-red-100';
      case 'shopping':
        return 'bg-blue-100';
      case 'travelling':
        return 'bg-green-100';
      case 'entertainment':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      <StatCard
        title="Total Spent"
        value={formatCurrency(totalExpenses)}
        icon={DollarSign}
        trend={{
          value: monthlyChange,
          isPositive: monthlyChange < 0
        }}
        iconBgColor="bg-blue-100"
        loading={loading}
      />
      
      <StatCard
        title="Budget Used"
        value={`${budgetUsed.toFixed(1)}%`}
        icon={Calendar}
        iconBgColor={budgetUsed > 80 ? "bg-red-100" : "bg-green-100"}
        loading={loading}
      />
      
      <StatCard
        title="Remaining"
        value={formatCurrency(Math.max(0, remaining))}
        icon={remaining >= 0 ? TrendingUp : TrendingDown}
        iconBgColor={remaining >= 0 ? "bg-green-100" : "bg-red-100"}
        loading={loading}
      />
      
      <StatCard
        title="Top Category"
        value={formatCurrency(topCategory.amount)}
        icon={topCategory.icon}
        iconBgColor={getCategoryIconBg(topCategory.name)}
        loading={loading}
      />
    </div>
  );
};

export default QuickStats;