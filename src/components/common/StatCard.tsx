// src/components/common/StatCard.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    icon: 'bg-gray-100 text-gray-700',
    trend: {
      positive: 'text-green-600',
      negative: 'text-red-600'
    }
  },
  primary: {
    icon: 'bg-blue-100 text-blue-700',
    trend: {
      positive: 'text-blue-600',
      negative: 'text-blue-600'
    }
  },
  success: {
    icon: 'bg-green-100 text-green-700',
    trend: {
      positive: 'text-green-600',
      negative: 'text-green-600'
    }
  },
  warning: {
    icon: 'bg-yellow-100 text-yellow-700',
    trend: {
      positive: 'text-yellow-600',
      negative: 'text-yellow-600'
    }
  },
  danger: {
    icon: 'bg-red-100 text-red-700',
    trend: {
      positive: 'text-red-600',
      negative: 'text-red-600'
    }
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  loading = false,
  className,
  onClick
}) => {
  const styles = variantStyles[variant];

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              {description && <Skeleton className="h-3 w-32" />}
            </div>
            {Icon && <Skeleton className="h-12 w-12 rounded-full" />}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline mt-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className={cn(
                  "flex items-center ml-2",
                  trend.isPositive ? styles.trend.positive : styles.trend.negative
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(trend.value)}%
                    {trend.label && ` ${trend.label}`}
                  </span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-2">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "p-3 rounded-full",
              styles.icon
            )}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Preset stat cards for common use cases
export const MetricCard: React.FC<Omit<StatCardProps, 'variant'>> = (props) => (
  <StatCard {...props} variant="primary" />
);

export const SuccessCard: React.FC<Omit<StatCardProps, 'variant'>> = (props) => (
  <StatCard {...props} variant="success" />
);

export const WarningCard: React.FC<Omit<StatCardProps, 'variant'>> = (props) => (
  <StatCard {...props} variant="warning" />
);

export const DangerCard: React.FC<Omit<StatCardProps, 'variant'>> = (props) => (
  <StatCard {...props} variant="danger" />
);

export default StatCard;