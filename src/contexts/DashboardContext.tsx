// src/contexts/DashboardContext.tsx - Updated with centralized debug
'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
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
import { debug } from '@/utils/debug-client'; // Import centralized debug

interface DashboardContextType extends DashboardState {
  metrics: DashboardMetrics;
  addExpense: (category: ExpenseCategory, amount: number, date: string) => Promise<void>;
  updateBudget: (budget: number) => Promise<void>;
  refreshData: () => Promise<void>;
  setDateRange: (range: DateRange | null) => void;
  retryOperation: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

interface DashboardProviderProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  onLogout,
}) => {
  const { toast } = useToast();
  
  // Use refs to store stable references
  const toastRef = useRef(toast);
  const onLogoutRef = useRef(onLogout);
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);

  // Update refs when props change
  toastRef.current = toast;
  onLogoutRef.current = onLogout;
  
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
  const metrics = useMemo(() => {
    const startTime = performance.now();
    const result = calculateDashboardMetrics(state.expenseData, state.dateRange, state.totalBalance);
    
    debug.perf('calculateMetrics', 'Dashboard metrics calculation', {
      duration: performance.now() - startTime,
      expenseCount: state.expenseData.length,
      totalExpenses: result.totalExpenses
    });
    
    return result;
  }, [state.expenseData, state.dateRange, state.totalBalance]);

  // Stable error handler
  const handleError = useCallback((error: unknown, context: string) => {
    debug.dashboardError(`Error in ${context}`, { error });
    
    let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
    let shouldLogout = false;
    
    if (error instanceof DashboardError) {
      errorMessage = error.message;
      
      if (error.code === 'SESSION_EXPIRED' || error.statusCode === 401) {
        shouldLogout = true;
        errorMessage = 'Your session has expired. Please login again.';
        debug.auth('Session expired, will logout user');
      }
    } else if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
        debug.dashboard('Network error detected');
      } else {
        errorMessage = error.message || ERROR_MESSAGES.SERVER_ERROR;
      }
    }
    
    setState(prev => ({ 
      ...prev, 
      error: errorMessage, 
      loading: false, 
      refreshing: false 
    }));
    
    if (shouldLogout) {
      toastRef.current({
        title: 'Session Expired',
        description: errorMessage,
        variant: 'destructive',
      });
      setTimeout(() => {
        debug.auth('Logging out user due to session expiry');
        onLogoutRef.current();
      }, 1500);
    } else {
      toastRef.current({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, []);

  // Fetch expenses with concurrency protection and debug
  const fetchExpenses = useCallback(async () => {
    if (fetchingRef.current) {
      debug.dashboard('Fetch already in progress, skipping duplicate request');
      return;
    }

    fetchingRef.current = true;
    const startTime = performance.now();
    
    try {
      debug.dashboard('Starting to fetch expenses');
      
      const expenses = await dashboardApi.getExpenses({
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 50
      });
      
      debug.dashboard('Expenses fetched successfully', { 
        count: expenses.length,
        duration: performance.now() - startTime 
      });
      
      const sortedExpenses = sortExpensesByDate(expenses || []);
      
      setState(prev => ({
        ...prev,
        expenseData: sortedExpenses,
        error: null,
      }));
    } catch (error) {
      debug.dashboardError('Failed to fetch expenses', { 
        error,
        duration: performance.now() - startTime 
      });
      handleError(error, 'fetchExpenses');
    } finally {
      fetchingRef.current = false;
    }
  }, [handleError]);

  // Fetch monthly budget with debug
  const fetchMonthlyBudget = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      debug.dashboard('Starting to fetch monthly budget');
      const budget = await dashboardApi.getMonthlyBudget();
      
      debug.dashboard('Monthly budget fetched successfully', { 
        budget,
        duration: performance.now() - startTime 
      });
      
      setState(prev => ({ 
        ...prev, 
        totalBalance: budget || 0 
      }));
    } catch (error) {
      debug.dashboardError('Failed to fetch monthly budget', { 
        error,
        duration: performance.now() - startTime 
      });
      handleError(error, 'fetchMonthlyBudget');
    }
  }, [handleError]);

  // Initial data load with debug
  const loadInitialData = useCallback(async () => {
    if (initializedRef.current || fetchingRef.current) {
      debug.dashboard('Dashboard already initialized or fetching, skipping');
      return;
    }

    const startTime = performance.now();
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      debug.dashboard('Starting initial data load...');
      
      await Promise.all([fetchExpenses(), fetchMonthlyBudget()]);
      
      debug.dashboard('Initial data load completed successfully', {
        duration: performance.now() - startTime
      });
      initializedRef.current = true;
    } catch (error) {
      debug.dashboardError('Initial data load failed', { 
        error,
        duration: performance.now() - startTime 
      });
      handleError(error, 'loadInitialData');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchExpenses, fetchMonthlyBudget, handleError]);

  // Refresh data with debug
  const refreshData = useCallback(async () => {
    const startTime = performance.now();
    setState(prev => ({ ...prev, refreshing: true, error: null }));
    
    try {
      debug.dashboard('Starting data refresh...');
      
      await Promise.all([fetchExpenses(), fetchMonthlyBudget()]);
      
      debug.dashboard('Data refresh completed successfully', {
        duration: performance.now() - startTime
      });
      
      toastRef.current({
        title: 'Success',
        description: SUCCESS_MESSAGES.DATA_REFRESHED,
      });
    } catch (error) {
      debug.dashboardError('Data refresh failed', { 
        error,
        duration: performance.now() - startTime 
      });
      handleError(error, 'refreshData');
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [fetchExpenses, fetchMonthlyBudget, handleError]);

  // Add expense with debug
  const addExpense = useCallback(async (
    category: ExpenseCategory,
    amount: number,
    date: string
  ) => {
    const startTime = performance.now();
    debug.dashboard('Adding expense', { category, amount, date });
    
    // Validation
    const amountValidation = validateExpenseAmount(amount);
    const dateValidation = validateExpenseDate(date);
    
    if (!amountValidation.isValid) {
      debug.dashboard('Invalid expense amount', { amount, errors: amountValidation.errors });
      toastRef.current({
        title: 'Invalid Amount',
        description: amountValidation.errors[0],
        variant: 'destructive',
      });
      return;
    }
    
    if (!dateValidation.isValid) {
      debug.dashboard('Invalid expense date', { date, errors: dateValidation.errors });
      toastRef.current({
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
        debug.ui('Applied optimistic update to existing expense', { date, category, amount });
        return sortExpensesByDate(updated);
      } else {
        const newEntry: ExpenseEntry = {
          _id: `temp-${Date.now()}`,
          date,
          food: 0,
          shopping: 0,
          travelling: 0,
          entertainment: 0,
          [category]: amount,
          user: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        debug.ui('Created optimistic new expense entry', { newEntry });
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
        const updated = prev.expenseData.filter(exp => 
          exp.date !== updatedExpense.date || exp._id?.startsWith('temp-')
        );
        const result = {
          ...prev,
          expenseData: sortExpensesByDate([...updated, updatedExpense]),
        };
        
        debug.dashboard('Expense added successfully', { 
          category, 
          amount, 
          date,
          duration: performance.now() - startTime,
          totalExpenses: result.expenseData.length
        });
        
        return result;
      });

      toastRef.current({
        title: 'Expense Added',
        description: `${amount.toFixed(2)} added to ${category}`,
      });
    } catch (error) {
      debug.dashboardError('Failed to add expense, reverting optimistic update', { 
        error,
        duration: performance.now() - startTime 
      });
      // Revert optimistic update on failure
      await fetchExpenses();
      handleError(error, 'addExpense');
    }
  }, [fetchExpenses, handleError]);

  // Update budget with debug
  const updateBudget = useCallback(async (budget: number) => {
    const startTime = performance.now();
    debug.dashboard('Updating budget', { newBudget: budget });
    
    try {
      const updatedBudget = await dashboardApi.updateMonthlyBudget(budget);
      
      setState(prev => ({ ...prev, totalBalance: updatedBudget }));
      
      debug.dashboard('Budget updated successfully', { 
        oldBudget: budget,
        newBudget: updatedBudget,
        duration: performance.now() - startTime 
      });
      
      toastRef.current({
        title: 'Budget Updated',
        description: `Monthly budget set to ${updatedBudget.toFixed(2)}`,
      });
    } catch (error) {
      debug.dashboardError('Failed to update budget', { 
        error,
        duration: performance.now() - startTime 
      });
      handleError(error, 'updateBudget');
    }
  }, [handleError]);

  // Set date range with debouncing and debug
  const debouncedSetDateRange = useMemo(
    () => debounce((range: DateRange | null) => {
      debug.ui('Date range changed', { range });
      setState(prev => ({ ...prev, dateRange: range }));
    }, 300),
    []
  );

  const setDateRange = useCallback((range: DateRange | null) => {
    debouncedSetDateRange(range);
  }, [debouncedSetDateRange]);

  // Retry operations with debug
  const retryOperation = useCallback(async () => {
    debug.dashboard('Retrying failed operations...');
    initializedRef.current = false;
    fetchingRef.current = false;
    await loadInitialData();
  }, [loadInitialData]);

  // Initialize dashboard - only run once with debug
  useEffect(() => {
    if (!initializedRef.current) {
      debug.dashboard('Dashboard context initializing...');
      loadInitialData();
    }
  }, [loadInitialData]);

  const contextValue: DashboardContextType = {
    ...state,
    metrics,
    addExpense,
    updateBudget,
    refreshData,
    setDateRange,
    retryOperation,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};