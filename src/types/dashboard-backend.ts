// src/types/dashboard-backend.ts
import { Document } from 'mongoose';

export interface IExpense extends Document {
  _id: string;
  date: string; // Stored as 'YYYY-MM-DD'
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
  user: string; // Reference to the User ID
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCategory = 'food' | 'shopping' | 'travelling' | 'entertainment';

export interface ExpenseData {
  id: string;
  date: string;
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  date: string;
  category: ExpenseCategory;
  amount: number;
}

export interface UpdateExpenseRequest {
  expenseId: string;
  updates: Partial<Pick<IExpense, 'food' | 'shopping' | 'travelling' | 'entertainment'>>;
}

export interface BudgetRequest {
  parsedBudget: number;
}

export interface ExpenseQueryParams {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'total' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseFilters {
  user: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export interface ExpenseStats {
  totalExpenses: number;
  averageDaily: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  daysWithExpenses: number;
  totalDays: number;
  highestSpendingDay: {
    date: string;
    amount: number;
  } | null;
  categoryStats: Record<ExpenseCategory, {
    total: number;
    average: number;
    percentage: number;
    daysActive: number;
  }>;
}

export interface DashboardResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  stats?: ExpenseStats;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class DashboardError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'DASHBOARD_ERROR',
    statusCode: number = 400,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'DashboardError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export enum DashboardErrorCodes {
  INVALID_DATE = 'INVALID_DATE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  EXPENSE_NOT_FOUND = 'EXPENSE_NOT_FOUND',
  DUPLICATE_EXPENSE = 'DUPLICATE_EXPENSE',
  BUDGET_LIMIT_EXCEEDED = 'BUDGET_LIMIT_EXCEEDED',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// Validation constants
export const VALIDATION_CONSTANTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 100000,
  MIN_BUDGET: 0,
  MAX_BUDGET: 10000000,
  MAX_DATE_RANGE_DAYS: 365,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  VALID_CATEGORIES: ['food', 'shopping', 'travelling', 'entertainment'] as const,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/
};

// Aggregation pipeline interfaces
export interface CategoryAggregation {
  _id: ExpenseCategory;
  total: number;
  count: number;
  average: number;
}

export interface DateRangeAggregation {
  _id: string; // date
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
  total: number;
  count: number;
}