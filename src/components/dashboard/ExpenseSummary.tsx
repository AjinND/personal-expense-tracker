// src/components/dashboard/ExpenseSummary.tsx
"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Edit2,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DashboardMetrics } from "@/types/dashboard";
import { getBudgetStatus, formatCurrency, validateBudgetAmount } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import { ExpenseSummaryProps } from "@/types/components";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
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
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(trend.value).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-full", iconBgColor)}>
            <Icon className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  metrics,
  totalBalance,
  onBudgetUpdate,
  loading = false,
  monthlyChange = 0,
  topCategory,
  className,
}) => {
  const [newBudget, setNewBudget] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const budgetStatus = getBudgetStatus(metrics.remainingBudget, totalBalance);
  const budgetProgress = totalBalance > 0 ? (metrics.totalExpenses / totalBalance) * 100 : 0;
  const budgetUsed = totalBalance > 0 ? (metrics.totalExpenses / totalBalance) * 100 : 0;
  const remaining = totalBalance - metrics.totalExpenses;

  // Calculate current month progress
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthProgress = (currentDay / daysInMonth) * 100;

  const validateAndUpdateBudget = async () => {
    const budget = parseFloat(newBudget);
    const validation = validateBudgetAmount(budget);
    
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      await onBudgetUpdate(budget);
      setIsDialogOpen(false);
      setNewBudget("");
      setValidationError("");
    } catch (error) {
      setValidationError("Failed to update budget. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNewBudget(value);
      setValidationError("");
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} title="" value="" icon={DollarSign} loading={true} />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      
      {/* Overview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
          <Badge 
            variant={budgetProgress >= 100 ? "destructive" : budgetProgress >= 80 ? "secondary" : "default"}
            className="text-sm"
          >
            {budgetProgress >= 100 ? "Over Budget" : budgetProgress >= 80 ? "Near Limit" : "On Track"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Spent"
            value={formatCurrency(metrics.totalExpenses)}
            icon={DollarSign}
            trend={monthlyChange !== 0 ? {
              value: monthlyChange,
              isPositive: monthlyChange < 0 // Negative change is good for expenses
            } : undefined}
            iconBgColor="bg-blue-100"
          />
          
          <StatCard
            title="Budget Used"
            value={`${budgetUsed.toFixed(1)}%`}
            icon={Calendar}
            iconBgColor={budgetUsed > 80 ? "bg-red-100" : "bg-green-100"}
          />
          
          <StatCard
            title="Remaining"
            value={formatCurrency(Math.max(0, remaining))}
            icon={remaining >= 0 ? TrendingUp : TrendingDown}
            iconBgColor={remaining >= 0 ? "bg-green-100" : "bg-red-100"}
          />
          
          {topCategory && (
            <StatCard
              title="Top Category"
              value={formatCurrency(topCategory.amount)}
              icon={topCategory.icon}
              iconBgColor="bg-purple-100"
            />
          )}
        </div>
      </div>

      {/* Budget Progress Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Monthly Budget Progress</span>
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Monthly Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Monthly Budget ($)</Label>
                  <Input
                    id="budget"
                    type="text"
                    value={newBudget}
                    onChange={handleBudgetChange}
                    placeholder={totalBalance.toString()}
                    className="mt-1"
                  />
                </div>
                {validationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={validateAndUpdateBudget}
                  disabled={isSubmitting || !newBudget}
                >
                  {isSubmitting ? "Updating..." : "Update Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Budget vs Spending Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {formatCurrency(metrics.totalExpenses)} of {formatCurrency(totalBalance)}
              </span>
              <span className="font-medium">
                {budgetUsed.toFixed(1)}% used
              </span>
            </div>
            <Progress 
              value={budgetUsed} 
              className={cn(
                "h-3",
                budgetUsed >= 100 && "[&>div]:bg-red-500",
                budgetUsed >= 80 && budgetUsed < 100 && "[&>div]:bg-yellow-500"
              )}
            />
          </div>

          {/* Month Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Month Progress</span>
              <span className="text-gray-600">Day {currentDay} of {daysInMonth}</span>
            </div>
            <Progress value={monthProgress} className="h-2" />
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">
                {remaining >= 0 ? "Remaining" : "Over Budget"}
              </p>
              <p className={cn(
                "text-lg font-semibold",
                remaining >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(Math.abs(remaining))}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Daily Average</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(currentDay > 0 ? metrics.totalExpenses / currentDay : 0)}
              </p>
            </div>
          </div>

          {/* Status Alert */}
          {budgetUsed >= 90 && (
            <Alert variant={budgetUsed >= 100 ? "destructive" : "default"}>
              {budgetUsed >= 100 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {budgetUsed >= 100 
                  ? `You've exceeded your budget by ${formatCurrency(Math.abs(remaining))}.`
                  : `You're approaching your budget limit. ${formatCurrency(remaining)} remaining.`
                }
              </AlertDescription>
            </Alert>
          )}
          
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSummary;