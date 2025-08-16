// src/utils/dashboardValidation.ts
import { 
  ExpenseCategory, 
  VALIDATION_CONSTANTS,
  DashboardError,
  DashboardErrorCodes 
} from '@/types/dashboard-backend';

/**
 * Utility functions for dashboard data validation
 */

export class DashboardValidator {
  
  /**
   * Validate date string format and constraints
   */
  static validateDate(date: string): void {
    if (!VALIDATION_CONSTANTS.DATE_FORMAT.test(date)) {
      throw new DashboardError(
        'Invalid date format. Use YYYY-MM-DD',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }

    const expenseDate = new Date(date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (isNaN(expenseDate.getTime())) {
      throw new DashboardError(
        'Invalid date value',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }

    if (expenseDate > today) {
      throw new DashboardError(
        'Expense date cannot be in the future',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }

    if (expenseDate < oneYearAgo) {
      throw new DashboardError(
        'Expense date cannot be more than 1 year ago',
        DashboardErrorCodes.INVALID_DATE,
        400
      );
    }
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate?: string, endDate?: string): void {
    if (startDate) this.validateDate(startDate);
    if (endDate) this.validateDate(endDate);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        throw new DashboardError(
          'Start date cannot be after end date',
          DashboardErrorCodes.INVALID_DATE_RANGE,
          400
        );
      }

      // Check if date range is too large
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > VALIDATION_CONSTANTS.MAX_DATE_RANGE_DAYS) {
        throw new DashboardError(
          `Date range cannot exceed ${VALIDATION_CONSTANTS.MAX_DATE_RANGE_DAYS} days`,
          DashboardErrorCodes.INVALID_DATE_RANGE,
          400
        );
      }
    }
  }

  /**
   * Validate expense amount
   */
  static validateAmount(amount: number, fieldName: string = 'Amount'): void {
    if (!Number.isFinite(amount)) {
      throw new DashboardError(
        `${fieldName} must be a valid number`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    if (amount < VALIDATION_CONSTANTS.MIN_AMOUNT) {
      throw new DashboardError(
        `${fieldName} must be at least ${VALIDATION_CONSTANTS.MIN_AMOUNT}`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    if (amount > VALIDATION_CONSTANTS.MAX_AMOUNT) {
      throw new DashboardError(
        `${fieldName} cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }
  }

  /**
   * Validate budget amount
   */
  static validateBudget(budget: number): void {
    if (!Number.isFinite(budget)) {
      throw new DashboardError(
        'Budget must be a valid number',
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    if (budget < VALIDATION_CONSTANTS.MIN_BUDGET) {
      throw new DashboardError(
        'Budget cannot be negative',
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    if (budget > VALIDATION_CONSTANTS.MAX_BUDGET) {
      throw new DashboardError(
        `Budget cannot exceed ${VALIDATION_CONSTANTS.MAX_BUDGET}`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }
  }

  /**
   * Validate expense category
   */
  static validateCategory(category: string): asserts category is ExpenseCategory {
    if (!VALIDATION_CONSTANTS.VALID_CATEGORIES.includes(category as ExpenseCategory)) {
      throw new DashboardError(
        `Invalid category. Must be one of: ${VALIDATION_CONSTANTS.VALID_CATEGORIES.join(', ')}`,
        DashboardErrorCodes.INVALID_CATEGORY,
        400
      );
    }
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
    const validatedLimit = limit || VALIDATION_CONSTANTS.DEFAULT_LIMIT;
    const validatedOffset = offset || 0;

    if (!Number.isInteger(validatedLimit) || validatedLimit < 1) {
      throw new DashboardError(
        'Limit must be a positive integer',
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    if (validatedLimit > VALIDATION_CONSTANTS.MAX_LIMIT) {
      throw new DashboardError(
        `Limit cannot exceed ${VALIDATION_CONSTANTS.MAX_LIMIT}`,
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    if (!Number.isInteger(validatedOffset) || validatedOffset < 0) {
      throw new DashboardError(
        'Offset must be a non-negative integer',
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    return { limit: validatedLimit, offset: validatedOffset };
  }

  /**
   * Validate MongoDB ObjectId
   */
  static validateObjectId(id: string, fieldName: string = 'ID'): void {
    if (!id || typeof id !== 'string') {
      throw new DashboardError(
        `${fieldName} is required`,
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    // Basic ObjectId format validation (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new DashboardError(
        `Invalid ${fieldName} format`,
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }

  /**
   * Sanitize and validate sort parameters
   */
  static validateSortParams(
    sortBy?: string, 
    sortOrder?: string
  ): { sortBy: string; sortOrder: 'asc' | 'desc' } {
    const validSortFields = ['date', 'total', 'createdAt', 'updatedAt'];
    const validSortBy = sortBy && validSortFields.includes(sortBy) ? sortBy : 'date';
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    return { sortBy: validSortBy, sortOrder: validSortOrder };
  }

  /**
   * Validate expense totals don't exceed daily limits
   */
  static validateDailyTotal(expenses: Record<ExpenseCategory, number>): void {
    const total = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    
    if (total > VALIDATION_CONSTANTS.MAX_AMOUNT) {
      throw new DashboardError(
        `Total daily expenses cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`,
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    // Ensure at least one category has a positive value
    if (total <= 0) {
      throw new DashboardError(
        'At least one expense category must have a positive value',
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }
  }

  /**
   * Validate bulk operation size
   */
  static validateBulkSize(items: any[], maxSize: number = 100): void {
    if (!Array.isArray(items)) {
      throw new DashboardError(
        'Bulk data must be an array',
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    if (items.length === 0) {
      throw new DashboardError(
        'Bulk operation requires at least one item',
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    if (items.length > maxSize) {
      throw new DashboardError(
        `Cannot process more than ${maxSize} items at once`,
        DashboardErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }

  /**
   * Sanitize string input to prevent injection attacks
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .substring(0, maxLength);
  }

  /**
   * Validate and normalize currency amount
   */
  static normalizeCurrency(amount: number): number {
    if (!Number.isFinite(amount)) {
      throw new DashboardError(
        'Invalid currency amount',
        DashboardErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    // Round to 2 decimal places for currency
    return Math.round(amount * 100) / 100;
  }
}

// Export individual validation functions for convenience
export const {
  validateDate,
  validateDateRange,
  validateAmount,
  validateBudget,
  validateCategory,
  validatePagination,
  validateObjectId,
  validateSortParams,
  validateDailyTotal,
  validateBulkSize,
  sanitizeString,
  normalizeCurrency
} = DashboardValidator;