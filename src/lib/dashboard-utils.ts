// src/lib/dashboard-utils.ts
import { format, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  ExpenseEntry,
  CategoryTotals,
  DashboardMetrics,
  ChartDataPoint,
  PieChartDataPoint,
  ValidationResult,
  ExpenseCategory,
} from '@/types/dashboard';
import {
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  DATE_FORMATS,
  VALIDATION_RULES,
} from '@/constants/dashboard';

// Date utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: Date | string, formatType: keyof typeof DATE_FORMATS = 'DISPLAY'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATE_FORMATS[formatType]);
};

export const getCurrentWeekRange = (): DateRange => {
  const today = new Date();
  return {
    from: startOfWeek(today, { weekStartsOn: 0 }),
    to: endOfWeek(today, { weekStartsOn: 0 }),
  };
};

export const calculateDateRangeDays = (dateRange: DateRange | null): number => {
  if (!dateRange?.from || !dateRange?.to) return 1;
  return Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);
};

// Data processing utilities
export const filterExpensesByDateRange = (
  expenses: ExpenseEntry[],
  dateRange: DateRange | null
): ExpenseEntry[] => {
  if (!dateRange?.from || !dateRange?.to) return [];

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const startDate = new Date(dateRange.from!);
    const endDate = new Date(dateRange.to!);
    
    return expenseDate >= startDate && expenseDate <= endDate;
  });
};

export const calculateCategoryTotals = (expenses: ExpenseEntry[]): CategoryTotals => {
  return expenses.reduce(
    (totals, expense) => ({
      food: totals.food + (expense.food || 0),
      shopping: totals.shopping + (expense.shopping || 0),
      travelling: totals.travelling + (expense.travelling || 0),
      entertainment: totals.entertainment + (expense.entertainment || 0),
    }),
    { food: 0, shopping: 0, travelling: 0, entertainment: 0 }
  );
};

export const calculateTotalExpenses = (categoryTotals: CategoryTotals): number => {
  return Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
};

export const calculateDashboardMetrics = (
  expenses: ExpenseEntry[],
  dateRange: DateRange | null,
  totalBalance: number
): DashboardMetrics => {
  const filteredExpenses = filterExpensesByDateRange(expenses, dateRange);
  const categoryTotals = calculateCategoryTotals(filteredExpenses);
  const totalExpenses = calculateTotalExpenses(categoryTotals);
  const numberOfDays = calculateDateRangeDays(dateRange);
  const averageSpending = totalExpenses / numberOfDays;
  const remainingBudget = totalBalance - totalExpenses;

  return {
    totalExpenses,
    averageSpending,
    remainingBudget,
    numberOfDays,
    categoryTotals,
  };
};

// Chart data preparation
export const prepareChartData = (expenses: ExpenseEntry[]): ChartDataPoint[] => {
  return expenses
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((expense) => ({
      ...expense,
      total: expense.food + expense.shopping + expense.travelling + expense.entertainment,
      formattedDate: formatDate(expense.date, 'DISPLAY'),
    }));
};

export const preparePieChartData = (categoryTotals: CategoryTotals): PieChartDataPoint[] => {
  const total = calculateTotalExpenses(categoryTotals);
  
  return Object.entries(categoryTotals)
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_NAMES[category as ExpenseCategory],
      value,
      color: CATEGORY_COLORS[category as ExpenseCategory],
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

// Validation utilities
export const validateExpenseAmount = (amount: number): ValidationResult => {
  const errors: string[] = [];

  if (isNaN(amount) || !isFinite(amount)) {
    errors.push('Amount must be a valid number');
  } else {
    if (amount < VALIDATION_RULES.MIN_EXPENSE_AMOUNT) {
      errors.push(`Amount must be at least $${VALIDATION_RULES.MIN_EXPENSE_AMOUNT}`);
    }
    if (amount > VALIDATION_RULES.MAX_EXPENSE_AMOUNT) {
      errors.push(`Amount cannot exceed $${VALIDATION_RULES.MAX_EXPENSE_AMOUNT.toLocaleString()}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateBudgetAmount = (amount: number): ValidationResult => {
  const errors: string[] = [];

  if (isNaN(amount) || !isFinite(amount)) {
    errors.push('Budget must be a valid number');
  } else {
    if (amount < VALIDATION_RULES.MIN_BUDGET_AMOUNT) {
      errors.push('Budget cannot be negative');
    }
    if (amount > VALIDATION_RULES.MAX_BUDGET_AMOUNT) {
      errors.push(`Budget cannot exceed $${VALIDATION_RULES.MAX_BUDGET_AMOUNT.toLocaleString()}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateExpenseDate = (date: string): ValidationResult => {
  const errors: string[] = [];
  const expenseDate = new Date(date);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (isNaN(expenseDate.getTime())) {
    errors.push('Invalid date format');
  } else {
    if (expenseDate > today) {
      errors.push('Expense date cannot be in the future');
    }
    if (expenseDate < oneYearAgo) {
      errors.push('Expense date cannot be more than 1 year ago');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sorting utilities
export const sortExpensesByDate = (expenses: ExpenseEntry[], ascending = true): ExpenseEntry[] => {
  return [...expenses].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Budget utilities
export const getBudgetStatus = (remainingBudget: number, totalBudget: number) => {
  if (remainingBudget < 0) {
    return {
      status: 'over' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      message: 'Over Budget',
      severity: 'high' as const,
    };
  }

  const percentage = totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 100;

  if (percentage > 20) {
    return {
      status: 'good' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      message: 'On Track',
      severity: 'low' as const,
    };
  }

  if (percentage > 10) {
    return {
      status: 'warning' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      message: 'Almost at Limit',
      severity: 'medium' as const,
    };
  }

  return {
    status: 'danger' as const,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    message: 'Near Budget Limit',
    severity: 'high' as const,
  };
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};