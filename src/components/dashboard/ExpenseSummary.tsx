// src/components/dashboard/ExpenseSummary.tsx
"use client";

import React, { useState } from "react";
import { Calendar, Wallet, TrendingUp, AlertTriangle, Target, DollarSign } from "lucide-react";
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
import { DashboardMetrics } from "@/types/dashboard";
import { getBudgetStatus, formatCurrency, validateBudgetAmount } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

interface ExpenseSummaryProps {
  metrics: DashboardMetrics;
  totalBalance: number;
  onBudgetUpdate: (budget: number) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  metrics,
  totalBalance,
  onBudgetUpdate,
  loading = false,
  className,
}) => {
  const [newBudget, setNewBudget] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const budgetStatus = getBudgetStatus(metrics.remainingBudget, totalBalance);
  const budgetProgress = totalBalance > 0 ? (metrics.totalExpenses / totalBalance) * 100 : 0;

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

  const openBudgetDialog = () => {
    setIsDialogOpen(true);
    setNewBudget("");
    setValidationError("");
  };

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6", className)}>
      {/* Total Expenses Card */}
      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
          <div className="p-2 bg-red-500 rounded-full">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              {formatCurrency(metrics.totalExpenses)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-red-600">
              <TrendingUp className="h-3 w-3" />
              <span>Current period total</span>
            </div>
            <div className="text-xs text-red-500">
              Across {metrics.numberOfDays} day{metrics.numberOfDays !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Spending Card */}
      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Average Daily Spending</CardTitle>
          <div className="p-2 bg-blue-500 rounded-full">
            <Calendar className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {formatCurrency(metrics.averageSpending)}
            </div>
            <div className="text-xs text-blue-600">
              Per day in selected period
            </div>
            <div className="text-xs text-blue-500">
              {metrics.averageSpending > 0 && (
                <>Monthly projection: {formatCurrency(metrics.averageSpending * 30)}</>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Status Card */}
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 border-0",
        budgetStatus.bgColor.replace('bg-', 'bg-gradient-to-br from-').replace('-50', '-50 to-').replace('50', '100')
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn("text-sm font-medium", budgetStatus.color)}>
            Budget Status
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/50"
                onClick={openBudgetDialog}
              >
                <div className={cn("p-2 rounded-full", budgetStatus.color.replace('text-', 'bg-'))}>
                  <Wallet className="h-4 w-4 text-white" />
                </div>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Update Monthly Budget
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-sm font-medium">
                    Monthly Budget Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="budget"
                      value={newBudget}
                      onChange={handleBudgetChange}
                      placeholder="0.00"
                      className="pl-8"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set your total monthly spending limit across all categories
                  </p>
                </div>

                {/* Current Budget Info */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Budget:</span>
                    <span className="font-medium">{formatCurrency(totalBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Spent:</span>
                    <span className="font-medium">{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Remaining:</span>
                    <span className={budgetStatus.color}>
                      {formatCurrency(Math.abs(metrics.remainingBudget))}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(100, budgetProgress)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>{budgetProgress.toFixed(1)}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={validateAndUpdateBudget}
                  disabled={isSubmitting || !newBudget}
                  className="min-w-[80px]"
                >
                  {isSubmitting ? "Updating..." : "Update Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className={cn("text-2xl sm:text-3xl font-bold", budgetStatus.color)}>
              {formatCurrency(Math.abs(metrics.remainingBudget))}
            </div>
            
            <div className={cn("flex items-center space-x-2 text-xs", budgetStatus.color)}>
              {metrics.remainingBudget < 0 && <AlertTriangle className="h-3 w-3" />}
              <span className="font-medium">{budgetStatus.message}</span>
            </div>
            
            {/* Budget Progress Visualization */}
            <div className="space-y-2">
              <Progress 
                value={Math.min(100, budgetProgress)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Spent</span>
                <span>Budget: {formatCurrency(totalBalance)}</span>
              </div>
            </div>

            {/* Budget insights */}
            {totalBalance > 0 && (
              <div className="text-xs space-y-1">
                {metrics.remainingBudget > 0 ? (
                  <p className="text-green-600">
                    You have {formatCurrency(metrics.remainingBudget)} left for this month
                  </p>
                ) : (
                  <p className="text-red-600">
                    You're {formatCurrency(Math.abs(metrics.remainingBudget))} over budget
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};