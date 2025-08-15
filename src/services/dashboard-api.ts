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
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      window.location.href = '/login';
      throw new DashboardError(ERROR_MESSAGES.SESSION_EXPIRED, 'SESSION_EXPIRED', 401);
    }
    
    if (error.response?.status === 429) {
      throw new DashboardError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
    }
    
    if (!error.response) {
      throw new DashboardError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
    }
    
    const errorData = error.response.data as { error?: string };
    throw new DashboardError(
      errorData.error || ERROR_MESSAGES.SERVER_ERROR,
      'API_ERROR',
      error.response.status
    );
  }
);

class DashboardApiService {
  // Expenses API
  async getExpenses(): Promise<ExpenseEntry[]> {
    try {
      const response: AxiosResponse<ApiResponse<ExpenseEntry[]>> = await apiClient.get(
        API_ENDPOINTS.EXPENSES
      );
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || ERROR_MESSAGES.DATA_FETCH_FAILED,
          'API_ERROR'
        );
      }
      
      return response.data.data || [];
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError(ERROR_MESSAGES.DATA_FETCH_FAILED, 'FETCH_ERROR');
    }
  }

  async addExpense(
    category: ExpenseCategory,
    amount: number,
    date: string
  ): Promise<ExpenseEntry> {
    try {
      const requestData: ExpenseCreateRequest = { category, amount, date };
      
      const response: AxiosResponse<ApiResponse<ExpenseEntry[]>> = await apiClient.post(
        API_ENDPOINTS.EXPENSES,
        requestData
      );
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || ERROR_MESSAGES.EXPENSE_ADD_FAILED,
          'API_ERROR'
        );
      }
      
      if (!response.data.data || response.data.data.length === 0) {
        throw new DashboardError('No expense data returned', 'INVALID_RESPONSE');
      }
      
      return response.data.data[0];
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError(ERROR_MESSAGES.EXPENSE_ADD_FAILED, 'ADD_ERROR');
    }
  }

  async updateExpense(
    expenseId: string,
    updates: Partial<Pick<ExpenseEntry, 'food' | 'shopping' | 'travelling' | 'entertainment'>>
  ): Promise<ExpenseEntry> {
    try {
      const response: AxiosResponse<ApiResponse<ExpenseEntry>> = await apiClient.put(
        API_ENDPOINTS.EXPENSES,
        { expenseId, updates }
      );
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || 'Failed to update expense',
          'API_ERROR'
        );
      }
      
      if (!response.data.data) {
        throw new DashboardError('No expense data returned', 'INVALID_RESPONSE');
      }
      
      return response.data.data;
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError('Failed to update expense', 'UPDATE_ERROR');
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.delete(
        `${API_ENDPOINTS.EXPENSES}?id=${expenseId}`
      );
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || 'Failed to delete expense',
          'API_ERROR'
        );
      }
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError('Failed to delete expense', 'DELETE_ERROR');
    }
  }

  // Budget API
  async getMonthlyBudget(): Promise<number> {
    try {
      const response: AxiosResponse<ApiResponse<{ monthlyBudget: number }>> = await apiClient.get(
        API_ENDPOINTS.BUDGET_MONTHLY
      );
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || 'Failed to fetch budget',
          'API_ERROR'
        );
      }
      
      return response.data.monthlyBudget || 0;
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError('Failed to fetch budget', 'FETCH_ERROR');
    }
  }

  async updateMonthlyBudget(budget: number): Promise<number> {
    try {
      const requestData: BudgetUpdateRequest = { parsedBudget: budget };
      
      const response: AxiosResponse<ApiResponse<{ budget: number }>> = await apiClient.post(
        API_ENDPOINTS.BUDGET_MONTHLY,
        requestData
      );
      
      if (!response.data.success) {
        throw new DashboardError(
          response.data.error || ERROR_MESSAGES.BUDGET_UPDATE_FAILED,
          'API_ERROR'
        );
      }
      
      return response.data.budget || budget;
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError(ERROR_MESSAGES.BUDGET_UPDATE_FAILED, 'UPDATE_ERROR');
    }
  }

  // Session validation
  async validateSession(): Promise<{ valid: boolean; user?: any }> {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post(
        API_ENDPOINTS.AUTH_SESSION
      );
      
      if (response.data.success) {
        return {
          valid: true,
          user: response.data.userData,
        };
      }
      
      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  // Batch operations
  async batchAddExpenses(expenses: ExpenseCreateRequest[]): Promise<ExpenseEntry[]> {
    try {
      const promises = expenses.map(expense => 
        this.addExpense(expense.category, expense.amount, expense.date)
      );
      
      return Promise.all(promises);
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError('Failed to add multiple expenses', 'BATCH_ERROR');
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