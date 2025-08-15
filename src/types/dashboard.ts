// src/types/dashboard.ts
import { DateRange } from "react-day-picker";

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyBudget?: number;
}

export interface ExpenseEntry {
  _id?: string;
  date: string;
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseCategory = keyof Omit<ExpenseEntry, 'date' | '_id' | 'user' | 'createdAt' | 'updatedAt'>;

export interface CategoryTotals {
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
}

export interface DashboardState {
  dateRange: DateRange | null;
  expenseData: ExpenseEntry[];
  loading: boolean;
  error: string | null;
  totalBalance: number;
  refreshing: boolean;
}

export interface DashboardMetrics {
  totalExpenses: number;
  averageSpending: number;
  remainingBudget: number;
  numberOfDays: number;
  categoryTotals: CategoryTotals;
}

export interface ChartDataPoint {
  date: string;
  food: number;
  shopping: number;
  travelling: number;
  entertainment: number;
  total?: number;
  formattedDate?: string;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface ExpenseCreateRequest {
  category: ExpenseCategory;
  amount: number;
  date: string;
}

export interface BudgetUpdateRequest {
  parsedBudget: number;
}

// Error types
export class DashboardError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}