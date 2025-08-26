// src/components/dashboard/CategoryCards.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plane, ShoppingCart, Utensils, Plus, TrendingUp } from "lucide-react";
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
import EnhancedDatePicker from "@/components/ui/enhanced-date-picker";
import { 
  CategoryCardsProps,
  CategoryTotals, 
  ExpenseCategory 
} from "@/types/dashboard";
import { 
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  CATEGORY_DESCRIPTIONS,
} from "@/constants/dashboard";
import { 
  formatCurrency, 
  validateExpenseAmount, 
  validateExpenseDate 
} from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  food: Utensils,
  shopping: ShoppingCart,
  travelling: Plane,
  entertainment: Music,
};

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  categoryTotals,
  onAddExpense,
  loading = false,
  className,
}) => {
  const [dialogStates, setDialogStates] = useState<Record<ExpenseCategory, {
    isOpen: boolean;
    amount: string;
    date: Date;
    isSubmitting: boolean;
    error: string;
  }>>({
    food: { isOpen: false, amount: "", date: new Date(), isSubmitting: false, error: "" },
    shopping: { isOpen: false, amount: "", date: new Date(), isSubmitting: false, error: "" },
    travelling: { isOpen: false, amount: "", date: new Date(), isSubmitting: false, error: "" },
    entertainment: { isOpen: false, amount: "", date: new Date(), isSubmitting: false, error: "" },
  });

  const maxCategoryValue = Math.max(...Object.values(categoryTotals));

  const updateDialogState = useCallback((
    category: ExpenseCategory, 
    updates: Partial<typeof dialogStates[ExpenseCategory]>
  ) => {
    setDialogStates(prev => ({
      ...prev,
      [category]: { ...prev[category], ...updates }
    }));
  }, []);

  const openDialog = useCallback((category: ExpenseCategory) => {
    updateDialogState(category, {
      isOpen: true,
      amount: "",
      date: new Date(),
      error: "",
      isSubmitting: false
    });
  }, [updateDialogState]);

  const closeDialog = useCallback((category: ExpenseCategory) => {
    updateDialogState(category, { isOpen: false });
  }, [updateDialogState]);

  const handleAmountChange = useCallback((category: ExpenseCategory, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      updateDialogState(category, { amount: value, error: "" });
    }
  }, [updateDialogState]);

  const handleDateChange = useCallback((category: ExpenseCategory, date: Date) => {
    updateDialogState(category, { date, error: "" });
  }, [updateDialogState]);

  const validateForm = useCallback((category: ExpenseCategory): boolean => {
    const state = dialogStates[category];
    const amount = parseFloat(state.amount);
    const amountValidation = validateExpenseAmount(amount);
    
    if (!amountValidation.isValid) {
      updateDialogState(category, { error: amountValidation.errors[0] });
      return false;
    }
    
    const dateValidation = validateExpenseDate(state.date.toLocaleDateString("en-CA"));
    if (!dateValidation.isValid) {
      updateDialogState(category, { error: dateValidation.errors[0] });
      return false;
    }

    return true;
  }, [dialogStates, updateDialogState]);

  const handleExpenseSave = useCallback(async (category: ExpenseCategory) => {
    if (!validateForm(category)) return;

    const state = dialogStates[category];
    updateDialogState(category, { isSubmitting: true });

    try {
      await onAddExpense(
        category,
        parseFloat(state.amount),
        state.date.toLocaleDateString("en-CA")
      );
      
      // Reset and close dialog on success
      updateDialogState(category, {
        isOpen: false,
        amount: "",
        date: new Date(),
        error: "",
        isSubmitting: false
      });
    } catch (error) {
      updateDialogState(category, {
        error: "Failed to add expense. Please try again.",
        isSubmitting: false
      });
    }
  }, [dialogStates, validateForm, onAddExpense, updateDialogState]);

  const getCategoryProgress = (value: number): number => {
    return maxCategoryValue > 0 ? (value / maxCategoryValue) * 100 : 0;
  };

  const getCategoryGrowth = (category: ExpenseCategory): string => {
    // This would typically come from comparing with previous period
    const growthRates: Record<ExpenseCategory, number> = {
      food: 12.5,
      shopping: -5.2,
      travelling: 23.1,
      entertainment: 8.7,
    };
    
    const growth = growthRates[category];
    return growth > 0 ? `+${growth}%` : `${growth}%`;
  };

  const getCategoryGrowthColor = (category: ExpenseCategory): string => {
    const growth = parseFloat(getCategoryGrowth(category));
    return growth > 0 ? "text-red-500" : "text-green-500";
  };

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
      {Object.entries(categoryTotals).map(([category, total]) => {
        const IconComponent = CATEGORY_ICONS[category as ExpenseCategory];
        const categoryKey = category as ExpenseCategory;
        const progress = getCategoryProgress(total);
        const growth = getCategoryGrowth(categoryKey);
        const growthColor = getCategoryGrowthColor(categoryKey);
        const dialogState = dialogStates[categoryKey];
        
        return (
          <Card 
            key={category} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {CATEGORY_NAMES[categoryKey]}
                  </CardTitle>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {CATEGORY_DESCRIPTIONS[categoryKey]}
                  </p>
                </div>
                
                <Dialog 
                  open={dialogState.isOpen} 
                  onOpenChange={(open) => open ? openDialog(categoryKey) : closeDialog(categoryKey)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 rounded-full group-hover:bg-white group-hover:shadow-md transition-all duration-200"
                    >
                      <div 
                        className="relative p-2 rounded-full transition-all duration-200 group-hover:scale-110"
                        style={{ backgroundColor: CATEGORY_COLORS[categoryKey] + '20' }}
                      >
                        {IconComponent && (
                          <IconComponent
                            className="h-4 w-4 transition-colors duration-200"
                            style={{ color: CATEGORY_COLORS[categoryKey] }}
                          />
                        )}
                        <div 
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ backgroundColor: CATEGORY_COLORS[categoryKey] }}
                        >
                          <Plus className="h-2 w-2 text-white" />
                        </div>
                      </div>
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        {IconComponent && (
                          <IconComponent 
                            className="h-4 w-4 sm:h-5 sm:w-5" 
                            style={{ color: CATEGORY_COLORS[categoryKey] }}
                          />
                        )}
                        <span className="truncate">Add {CATEGORY_NAMES[categoryKey]} Expense</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 sm:gap-6 py-4">
                      {/* Amount Input */}
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                          Amount Spent
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-base sm:text-lg">
                            $
                          </span>
                          <Input
                            id="amount"
                            value={dialogState.amount}
                            onChange={(e) => handleAmountChange(categoryKey, e.target.value)}
                            placeholder="0.00"
                            className="pl-8 text-base sm:text-lg font-medium h-12 sm:h-14"
                            disabled={dialogState.isSubmitting}
                            autoFocus
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the amount you spent on this {CATEGORY_NAMES[categoryKey].toLowerCase()} expense
                        </p>
                      </div>
                      
                      {/* Enhanced Date Picker */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Expense Date
                        </Label>
                        <EnhancedDatePicker
                          value={dialogState.date}
                          onChange={(date) => handleDateChange(categoryKey, date)}
                          disabled={dialogState.isSubmitting}
                          placeholder="Select expense date"
                        />
                      </div>

                      {/* Error Display */}
                      {dialogState.error && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-sm">{dialogState.error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Preview - More compact on mobile */}
                      {dialogState.amount && parseFloat(dialogState.amount) > 0 && (
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Expense Preview
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between items-center">
                              <span>Category:</span>
                              <span className="font-medium text-right">{CATEGORY_NAMES[categoryKey]}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Amount:</span>
                              <span className="font-medium text-lg sm:text-xl" style={{ color: CATEGORY_COLORS[categoryKey] }}>
                                {formatCurrency(parseFloat(dialogState.amount))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Date:</span>
                              <span className="font-medium text-right">
                                {dialogState.date.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                      <DialogClose asChild>
                        <Button variant="outline" disabled={dialogState.isSubmitting} className="w-full sm:w-auto order-2 sm:order-1">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={() => handleExpenseSave(categoryKey)}
                        disabled={dialogState.isSubmitting || !dialogState.amount}
                        className="w-full sm:w-auto min-w-[120px] order-1 sm:order-2"
                        style={{ backgroundColor: CATEGORY_COLORS[categoryKey] }}
                      >
                        {dialogState.isSubmitting ? "Adding..." : "Add Expense"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <div 
                  className="text-2xl sm:text-3xl font-bold transition-colors duration-200"
                  style={{ color: CATEGORY_COLORS[categoryKey] }}
                >
                  {formatCurrency(total)}
                </div>
                
                {/* Growth indicator */}
                <div className="flex items-center justify-between text-xs">
                  <span className={cn("font-medium flex items-center gap-1", growthColor)}>
                    <TrendingUp className={cn("h-3 w-3", growth.startsWith('+') ? 'text-red-500' : 'text-green-500 rotate-180')} />
                    {growth} vs last month
                  </span>
                </div>
              </div>
              
              {/* Progress visualization */}
              <div className="space-y-2">
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{ 
                    '--progress-background': CATEGORY_COLORS[categoryKey] + '20',
                    '--progress-foreground': CATEGORY_COLORS[categoryKey],
                  } as React.CSSProperties}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    {total === 0 ? "No expenses" : `${progress.toFixed(1)}% of max`}
                  </span>
                  <span className="font-medium">
                    {total === 0 ? "Tap to add" : "Tap for more"}
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">This period</span>
                  <span className="font-medium text-gray-700">
                    {total > 0 ? `${Math.round(total / (maxCategoryValue || 1) * 100)}% of spending` : 'Start tracking'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};