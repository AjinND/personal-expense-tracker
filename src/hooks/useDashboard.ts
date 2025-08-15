// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import {
  DashboardState,
  DashboardMetrics,
  ExpenseEntry,
  ExpenseCategory,
  DashboardError,
} from '@/types/dashboard';
import {
  calculateDashboardMetrics,
  getCurrentWeekRange,
  sortExpensesByDate,
  validateExpenseAmount,
  validateExpenseDate,
  debounce,
} from '@/lib/dashboard-utils';
import { dashboardApi } from '@/services/dashboard-api';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/dashboard';

interface UseDashboardProps {
  onLogout: () => void;
}

interface UseDashboardReturn extends DashboardState {
  metrics: DashboardMetrics;
  addExpense: (category: ExpenseCategory, amount: number, date: string) => Promise<void>;
  updateBudget: (budget: number) => Promise<void>;
  refreshData: () => Promise<void>;
  setDateRange: (range: DateRange | null) => void;
  retryOperation: () => Promise<void>;
}

export const useDashboard = ({ onLogout }: UseDashboardProps): UseDashboardReturn => {
  const { toast } = useToast();
  
  // Main state
  const [state, setState] = useState<DashboardState>({
    dateRange: getCurrentWeekRange(),
    expenseData: [],
    loading: true,
    error: null,
    totalBalance: 0,
    refreshing: false,
  });

  // Memoized metrics calculation
  const metrics = useMemo(
    () => calculateDashboardMetrics(state.expenseData, state.dateRange, state.totalBalance),
    [state.expenseData, state.dateRange, state.totalBalance]
  );

  // Error handler with toast notifications
  const handleError = useCallback((error: unknown, context: string) => {
    console.error(`Dashboard error in ${context}:`, error);
    
    let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    
    if (error instanceof DashboardError) {
      errorMessage = error.message;
      
      if (error.code === 'SESSION_EXPIRED') {
        toast({
          title: 'Session Expired',
          description: 'Please login again.',
          variant: 'destructive',
        });
        onLogout();
        return;
      }
    }
    
    setState(prev => ({ ...prev, error: errorMessage, loading: false, refreshing: false }));
    
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }, [toast, onLogout]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      const expenses = await dashboardApi.getExpenses();
      const sortedExpenses = sortExpensesByDate(expenses);
      
      setState(prev => ({
        ...prev,
        expenseData: sortedExpenses,
        error: null,
      }));
    } catch (error) {
      handleError(error, 'fetchExpenses');
    }
  }, [handleError]);

  // Fetch monthly budget
  const fetchMonthlyBudget = useCallback(async () => {
    try {
      const budget = await dashboardApi.getMonthlyBudget();
      setState(prev => ({ ...prev, totalBalance: budget }));
    } catch (error) {
      handleError(error, 'fetchMonthlyBudget');
    }
  }, [handleError]);

  // Initial data load
  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await Promise.all([fetchExpenses(), fetchMonthlyBudget()]);
    } catch (error) {
      handleError(error, 'loadInitialData');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchExpenses, fetchMonthlyBudget, handleError]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true, error: null }));
    
    try {
      await Promise.all([fetchExpenses(), fetchMonthlyBudget()]);
      
      toast({
        title: 'Success',
        description: SUCCESS_MESSAGES.DATA_REFRESHED,
      });
    } catch (error) {
      handleError(error, 'refreshData');
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [fetchExpenses, fetchMonthlyBudget, handleError, toast]);

  // Add expense with optimistic updates
  const addExpense = useCallback(async (
    category: ExpenseCategory,
    amount: number,
    date: string
  ) => {
    // Validation
    const amountValidation = validateExpenseAmount(amount);
    const dateValidation = validateExpenseDate(date);
    
    if (!amountValidation.isValid) {
      toast({
        title: 'Invalid Amount',
        description: amountValidation.errors[0],
        variant: 'destructive',
      });
      return;
    }
    
    if (!dateValidation.isValid) {
      toast({
        title: 'Invalid Date',
        description: dateValidation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    // Optimistic update
    const optimisticUpdate = (prevExpenses: ExpenseEntry[]): ExpenseEntry[] => {
      const existingIndex = prevExpenses.findIndex(expense => expense.date === date);
      
      if (existingIndex !== -1) {
        const updated = [...prevExpenses];
        updated[existingIndex] = {
          ...updated[existingIndex],
          [category]: updated[existingIndex][category] + amount,
        };
        return sortExpensesByDate(updated);
      } else {
        const newEntry: ExpenseEntry = {
          date,
          food: 0,
          shopping: 0,
          travelling: 0,
          entertainment: 0,
          [category]: amount,
        };
        return sortExpensesByDate([...prevExpenses, newEntry]);
      }
    };

    // Apply optimistic update
    setState(prev => ({
      ...prev,
      expenseData: optimisticUpdate(prev.expenseData),
    }));

    try {
      const updatedExpense = await dashboardApi.addExpense(category, amount, date);
      
      // Update with server response
      setState(prev => {
        const updated = prev.expenseData.filter(exp => exp.date !== updatedExpense.date);
        return {
          ...prev,
          expenseData: sortExpensesByDate([...updated, updatedExpense]),
        };
      });

      toast({
        title: 'Expense Added',
        description: `${amount.toFixed(2)} added to ${category}`,
      });
    } catch (error) {
      // Revert optimistic update on failure
      await fetchExpenses();
      handleError(error, 'addExpense');
    }
  }, [toast, fetchExpenses, handleError]);

  // Update budget
  const updateBudget = useCallback(async (budget: number) => {
    try {
      const updatedBudget = await dashboardApi.updateMonthlyBudget(budget);
      
      setState(prev => ({ ...prev, totalBalance: updatedBudget }));
      
      toast({
        title: 'Budget Updated',
        description: `Monthly budget set to ${updatedBudget.toFixed(2)}`,
      });
    } catch (error) {
      handleError(error, 'updateBudget');
    }
  }, [handleError, toast]);

  // Set date range with debouncing
  const debouncedSetDateRange = useMemo(
    () => debounce((range: DateRange | null) => {
      setState(prev => ({ ...prev, dateRange: range }));
    }, 300),
    []
  );

  const setDateRange = useCallback((range: DateRange | null) => {
    debouncedSetDateRange(range);
  }, [debouncedSetDateRange]);

  // Retry failed operations
  const retryOperation = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Initialize dashboard
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    ...state,
    metrics,
    addExpense,
    updateBudget,
    refreshData,
    setDateRange,
    retryOperation,
  };
};

// Hook for expense operations
export const useExpenseOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteExpense = useCallback(async (expenseId: string) => {
    setLoading(true);
    try {
      await dashboardApi.deleteExpense(expenseId);
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
      return true;
    } catch (error) {
      console.error('Delete expense error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateExpense = useCallback(async (
    expenseId: string,
    updates: Partial<Pick<ExpenseEntry, 'food' | 'shopping' | 'travelling' | 'entertainment'>>
  ) => {
    setLoading(true);
    try {
      const updatedExpense = await dashboardApi.updateExpense(expenseId, updates);
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
      return updatedExpense;
    } catch (error) {
      console.error('Update expense error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    deleteExpense,
    updateExpense,
    loading,
  };
};

// Hook for chart data
export const useChartData = (expenses: ExpenseEntry[], dateRange: DateRange | null) => {
  return useMemo(() => {
    const { prepareChartData, preparePieChartData, filterExpensesByDateRange, calculateCategoryTotals } = require('@/lib/dashboard-utils');
    
    const filteredExpenses = filterExpensesByDateRange(expenses, dateRange);
    const chartData = prepareChartData(filteredExpenses);
    const categoryTotals = calculateCategoryTotals(filteredExpenses);
    const pieChartData = preparePieChartData(categoryTotals);
    
    return {
      lineChartData: chartData,
      pieChartData,
      barChartData: chartData,
    };
  }, [expenses, dateRange]);
};