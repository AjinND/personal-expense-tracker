// src/constants/dashboard.ts
import { ExpenseCategory } from '@/types/dashboard';

// Category configuration
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#FF6384',
  shopping: '#36A2EB', 
  travelling: '#FFCE56',
  entertainment: '#4BC0C0',
} as const;

export const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  food: 'Food & Dining',
  shopping: 'Shopping',
  travelling: 'Travel',
  entertainment: 'Entertainment',
} as const;

export const CATEGORY_DESCRIPTIONS: Record<ExpenseCategory, string> = {
  food: 'Restaurants, groceries, and dining expenses',
  shopping: 'Clothing, electronics, and general purchases',
  travelling: 'Transportation, flights, and accommodation',
  entertainment: 'Movies, games, and recreational activities',
} as const;

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: 'Utensils',
  shopping: 'ShoppingCart',
  travelling: 'Plane',
  entertainment: 'Music',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  EXPENSES: '/api/expenses',
  BUDGET_MONTHLY: '/api/budget/monthly',
  AUTH_SESSION: '/api/auth/session',
} as const;

// Validation constants
export const VALIDATION_RULES = {
  MAX_EXPENSE_AMOUNT: 10000,
  MIN_EXPENSE_AMOUNT: 0.01,
  MAX_BUDGET_AMOUNT: 1000000,
  MIN_BUDGET_AMOUNT: 0,
  MAX_DATE_RANGE_DAYS: 365,
} as const;

// Chart configuration
export const CHART_CONFIG = {
  COLORS: Object.values(CATEGORY_COLORS),
  HEIGHT: 400,
  ANIMATION_DURATION: 300,
  TOOLTIP_FORMATTER: (value: number) => `$${value.toFixed(2)}`,
} as const;

// Date format constants
export const DATE_FORMATS = {
  INPUT: 'en-CA', // YYYY-MM-DD
  DISPLAY: 'MMM dd, yyyy',
  CHART_LABEL: 'MMM dd',
  ISO: 'yyyy-MM-dd',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  INVALID_DATA: 'Invalid data provided. Please check your input.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  EXPENSE_ADD_FAILED: 'Failed to add expense. Please try again.',
  BUDGET_UPDATE_FAILED: 'Failed to update budget. Please try again.',
  DATA_FETCH_FAILED: 'Failed to fetch data. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  EXPENSE_ADDED: 'Expense added successfully',
  BUDGET_UPDATED: 'Budget updated successfully',
  DATA_REFRESHED: 'Data refreshed successfully',
} as const;

// Loading states
export const LOADING_STATES = {
  INITIAL: 'initial',
  LOADING: 'loading',
  REFRESHING: 'refreshing',
  UPDATING: 'updating',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_PREFERENCES: 'user_preferences',
  DASHBOARD_CACHE: 'dashboard_cache',
} as const;