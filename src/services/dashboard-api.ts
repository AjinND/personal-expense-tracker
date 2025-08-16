// src/services/dashboard-api.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  ApiResponse,
  ExpenseEntry,
  ExpenseCreateRequest,
  BudgetUpdateRequest,
  DashboardError,
  ExpenseCategory,
} from '@/types/dashboard';
import {
  API_ENDPOINTS,
  ERROR_MESSAGES,
  STORAGE_KEYS,
} from '@/constants/dashboard';
import { dashboardApiFallback } from './dashboard-api-fallback';

// Axios instance with default configuration
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        window.location.href = '/';
      }
      throw new DashboardError(ERROR_MESSAGES.SESSION_EXPIRED, 'SESSION_EXPIRED', 401);
    }
    
    if (error.response?.status === 429) {
      throw new DashboardError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
    }
    
    if (!error.response) {
      throw new DashboardError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
    }
    
    const errorData = error.response.data as { error?: string; code?: string };
    throw new DashboardError(
      errorData.error || ERROR_MESSAGES.SERVER_ERROR,
      errorData.code || 'API_ERROR',
      error.response.status
    );
  }
);

class DashboardApiService {
  private useFallback = false;

  // Check if we should use fallback
  private async shouldUseFallback(): Promise<boolean> {
    if (this.useFallback) return true;

    try {
      // Quick health check
      const response = await apiClient.get('/api/health', { timeout: 2000 });
      return false;
    } catch (error) {
      console.warn('Backend not available, using fallback API');
      this.useFallback = true;
      return true;
    }
  }

  // Expenses API
  async getExpenses(): Promise<ExpenseEntry[]> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.getExpenses();
      }

      const response: AxiosResponse<{
        success: boolean;
        data?: ExpenseEntry[];
        error?: string;
      }> = await apiClient.get(API_ENDPOINTS.EXPENSES);
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || ERROR_MESSAGES.DATA_FETCH_FAILED,
          'API_ERROR'
        );
      }
      
      // Transform backend data to frontend format
      const expenses = response.data.data || [];
      return expenses.map(expense => ({
        _id: expense._id,
        date: expense.date,
        food: expense.food,
        shopping: expense.shopping,
        travelling: expense.travelling,
        entertainment: expense.entertainment,
        user: expense.user,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }));
    } catch (error) {
      console.error('Get expenses error, falling back:', error);
      return await dashboardApiFallback.getExpenses();
    }
  }

  async addExpense(
    category: ExpenseCategory,
    amount: number,
    date: string
  ): Promise<ExpenseEntry> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.addExpense(category, amount, date);
      }

      const requestData = { category, amount, date };
      
      const response: AxiosResponse<{
        success: boolean;
        data?: any;
        error?: string;
      }> = await apiClient.post(API_ENDPOINTS.EXPENSES, requestData);
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || ERROR_MESSAGES.EXPENSE_ADD_FAILED,
          'API_ERROR'
        );
      }
      
      const expenseData = response.data.data;
      if (!expenseData) {
        throw new DashboardError('No expense data returned', 'INVALID_RESPONSE');
      }
      
      // Transform backend response to frontend format
      return {
        _id: expenseData.id,
        date: expenseData.date,
        food: expenseData.food,
        shopping: expenseData.shopping,
        travelling: expenseData.travelling,
        entertainment: expenseData.entertainment,
        user: expenseData.user,
        createdAt: expenseData.createdAt,
        updatedAt: expenseData.updatedAt
      };
    } catch (error) {
      console.error('Add expense error, falling back:', error);
      return await dashboardApiFallback.addExpense(category, amount, date);
    }
  }

  async updateExpense(
    expenseId: string,
    updates: Partial<Pick<ExpenseEntry, 'food' | 'shopping' | 'travelling' | 'entertainment'>>
  ): Promise<ExpenseEntry> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.updateExpense(expenseId, updates);
      }

      const response: AxiosResponse<{
        success: boolean;
        data?: any;
        error?: string;
      }> = await apiClient.put(API_ENDPOINTS.EXPENSES, { expenseId, updates });
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || 'Failed to update expense',
          'API_ERROR'
        );
      }
      
      if (!response.data.data) {
        throw new DashboardError('No expense data returned', 'INVALID_RESPONSE');
      }
      
      const expenseData = response.data.data;
      return {
        _id: expenseData.id,
        date: expenseData.date,
        food: expenseData.food,
        shopping: expenseData.shopping,
        travelling: expenseData.travelling,
        entertainment: expenseData.entertainment,
        user: expenseData.user,
        createdAt: expenseData.createdAt,
        updatedAt: expenseData.updatedAt
      };
    } catch (error) {
      console.error('Update expense error, falling back:', error);
      return await dashboardApiFallback.updateExpense(expenseId, updates);
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.deleteExpense(expenseId);
      }

      const response: AxiosResponse<{
        success: boolean;
        error?: string;
      }> = await apiClient.delete(`${API_ENDPOINTS.EXPENSES}?id=${expenseId}`);
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || 'Failed to delete expense',
          'API_ERROR'
        );
      }
    } catch (error) {
      console.error('Delete expense error, falling back:', error);
      return await dashboardApiFallback.deleteExpense(expenseId);
    }
  }

  // Budget API
  async getMonthlyBudget(): Promise<number> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.getMonthlyBudget();
      }

      const response: AxiosResponse<{
        success: boolean;
        data?: { monthlyBudget: number };
        error?: string;
      }> = await apiClient.get(API_ENDPOINTS.BUDGET_MONTHLY);
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || 'Failed to fetch budget',
          'API_ERROR'
        );
      }
      
      return response.data.data?.monthlyBudget || 0;
    } catch (error) {
      console.error('Get budget error, falling back:', error);
      return await dashboardApiFallback.getMonthlyBudget();
    }
  }

  async updateMonthlyBudget(budget: number): Promise<number> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.updateMonthlyBudget(budget);
      }

      const requestData: BudgetUpdateRequest = { parsedBudget: budget };
      
      const response: AxiosResponse<{
        success: boolean;
        data?: { budget: number };
        error?: string;
      }> = await apiClient.post(API_ENDPOINTS.BUDGET_MONTHLY, requestData);
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || ERROR_MESSAGES.BUDGET_UPDATE_FAILED,
          'API_ERROR'
        );
      }
      
      return response.data.data?.budget || budget;
    } catch (error) {
      console.error('Update budget error, falling back:', error);
      return await dashboardApiFallback.updateMonthlyBudget(budget);
    }
  }

  // Session validation
  async validateSession(): Promise<{ valid: boolean; user?: any }> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.validateSession();
      }

      const response: AxiosResponse<{
        success: boolean;
        userData?: any;
        error?: string;
      }> = await apiClient.post(API_ENDPOINTS.AUTH_SESSION);
      
      if (response.data.success) {
        return {
          valid: true,
          user: response.data.userData,
        };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Session validation error, falling back:', error);
      return await dashboardApiFallback.validateSession();
    }
  }

  // Batch operations
  async batchAddExpenses(expenses: ExpenseCreateRequest[]): Promise<ExpenseEntry[]> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.batchAddExpenses(expenses);
      }

      const promises = expenses.map(expense => 
        this.addExpense(expense.category, expense.amount, expense.date)
      );
      
      return Promise.all(promises);
    } catch (error) {
      console.error('Batch add error, falling back:', error);
      return await dashboardApiFallback.batchAddExpenses(expenses);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Reset fallback mode (for testing/development)
  resetFallbackMode(): void {
    this.useFallback = false;
  }
}

// Export singleton instance
export const dashboardApi = new DashboardApiService();

// Export individual methods for tree-shaking
export const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getMonthlyBudget,
  updateMonthlyBudget,
  validateSession,
  batchAddExpenses,
  healthCheck,
} = dashboardApi;