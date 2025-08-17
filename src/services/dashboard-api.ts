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
  private isDevelopment = process.env.NODE_ENV === 'development';

  // Check if we should use fallback - only in development and only after a real error
  private async shouldUseFallback(): Promise<boolean> {
    // Never use fallback in production
    if (!this.isDevelopment) {
      return false;
    }

    // If we've already determined to use fallback, continue using it
    if (this.useFallback) {
      return true;
    }

    // Try to reach the health endpoint to see if backend is available
    try {
      const response = await apiClient.get('/api/health', { timeout: 2000 });
      // If health check passes, don't use fallback
      return false;
    } catch (error) {
      // Only use fallback in development when health check fails
      console.warn('⚠️ Backend health check failed in development environment. Will use fallback data for this session.');
      this.useFallback = true;
      return true;
    }
  }

  // Helper method to handle errors appropriately based on environment
  private async handleApiError(error: any, operation: string, fallbackMethod?: () => Promise<any>): Promise<any> {
  const isDev = this.isDevelopment;
  
  // Always log the error details in development
  if (isDev) {
    console.group(`🚨 API Error in ${operation}:`);
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.groupEnd();
  }

  // Determine if this is an infrastructure error vs application error
  const isInfrastructureError = this.isInfrastructureError(error);
  
  // In production, never use fallback - always throw the error
  if (!isDev) {
    throw error;
  }

  // Handle specific error types with helpful messages
  if (error.response?.status === 401) {
    console.error('❌ Authentication required. Please log in.');
    throw error;
  }

  if (error.response?.status === 403) {
    console.error('❌ Access forbidden. Check your permissions.');
    throw error;
  }

  if (error.response?.status === 400) {
    console.error('❌ Bad request. Check your data format and parameters.');
    console.error('💡 This usually means invalid data was sent to the API.');
    throw error;
  }

  if (error.response?.status === 429) {
    console.error('❌ Rate limit exceeded. Please wait before trying again.');
    throw error;
  }

  // In development, only use fallback for infrastructure errors
  if (isInfrastructureError && fallbackMethod) {
    console.warn(`⚠️ Infrastructure error detected. Using fallback data for ${operation} in development`);
    console.warn(`🔧 This is likely due to: backend not running, network issues, or server problems`);
    return await fallbackMethod();
  }

  // For all other errors, throw immediately
  console.error(`❌ Application error in ${operation}. Not using fallback data.`);
  throw error;
}

  // Determine if an error is infrastructure-related (should use fallback) vs application-related (should not)
  private isInfrastructureError(error: any): boolean {
  // Log details for debugging
  console.log('🔍 Error analysis:', {
    hasResponse: !!error.response,
    status: error.response?.status,
    message: error.message,
    code: error.code,
    name: error.name
  });

  // Network errors (backend not reachable) - these are infrastructure issues
  if (!error.response) {
    console.log('📡 No response received - treating as network/infrastructure error');
    return true;
  }

  // Authentication errors should NEVER use fallback - they need proper auth
  if (error.response?.status === 401 || error.response?.status === 403) {
    console.log('🔐 Authentication/Authorization error - NOT using fallback');
    return false;
  }

  // Validation errors should NOT use fallback - they indicate API usage issues  
  if (error.response?.status === 400) {
    console.log('📝 Validation error - NOT using fallback');
    return false;
  }

  // Rate limiting should NOT use fallback - it's a legitimate API response
  if (error.response?.status === 429) {
    console.log('⏰ Rate limit error - NOT using fallback');
    return false;
  }

  // Server errors (500+ range) - backend issues
  if (error.response?.status >= 500) {
    console.log('🔥 Server error (500+) - treating as infrastructure error');
    return true;
  }

  // Specific infrastructure-related status codes
  const infrastructureStatusCodes = [
    502, // Bad Gateway
    503, // Service Unavailable  
    504, // Gateway Timeout
    408, // Request Timeout
  ];

  if (infrastructureStatusCodes.includes(error.response?.status)) {
    console.log('⚠️ Infrastructure status code - treating as infrastructure error');
    return true;
  }

  // Check for specific error patterns that indicate infrastructure issues
  if (error.message?.includes('Network Error') || 
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNREFUSED') ||
      error.code === 'NETWORK_ERROR') {
    console.log('🌐 Network-related error message - treating as infrastructure error');
    return true;
  }

  // Any other 400-499 errors are application errors - don't use fallback
  if (error.response?.status >= 400 && error.response?.status < 500) {
    console.log('🚫 Client error - treating as application error');
    return false;
  }

  // If we can't determine, be conservative and don't use fallback
  console.log('❓ Unclear error type - NOT using fallback to be safe');
  return false;
}

  // Expenses API
  // async getExpenses(): Promise<ExpenseEntry[]> {
  //   try {
  //     if (await this.shouldUseFallback()) {
  //       return await dashboardApiFallback.getExpenses();
  //     }

  //     const response: AxiosResponse<{
  //       success: boolean;
  //       data?: ExpenseEntry[];
  //       error?: string;
  //     }> = await apiClient.get(API_ENDPOINTS.EXPENSES);
      
  //     if (!response.data.success) {
  //       throw new DashboardError(
  //         response.data.error || ERROR_MESSAGES.DATA_FETCH_FAILED,
  //         'API_ERROR'
  //       );
  //     }
      
  //     // Transform backend data to frontend format
  //     const expenses = response.data.data || [];
  //     return expenses.map(expense => ({
  //       _id: expense._id,
  //       date: expense.date,
  //       food: expense.food,
  //       shopping: expense.shopping,
  //       travelling: expense.travelling,
  //       entertainment: expense.entertainment,
  //       user: expense.user,
  //       createdAt: expense.createdAt,
  //       updatedAt: expense.updatedAt
  //     }));
  //   } catch (error) {
  //     return await this.handleApiError(
  //       error, 
  //       'getExpenses', 
  //       () => dashboardApiFallback.getExpenses()
  //     );
  //   }
  // }

    async getExpenses(options?: {
    startDate?: string;
    endDate?: string; 
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ExpenseEntry[]> {
    try {
      if (await this.shouldUseFallback()) {
        return await dashboardApiFallback.getExpenses();
      }

      // Build query parameters properly
      const searchParams = new URLSearchParams();
      
      if (options?.startDate) searchParams.append('startDate', options.startDate);
      if (options?.endDate) searchParams.append('endDate', options.endDate);
      if (options?.category) searchParams.append('category', options.category);
      if (options?.limit) searchParams.append('limit', options.limit.toString());
      if (options?.offset) searchParams.append('offset', options.offset.toString());
      if (options?.sortBy) searchParams.append('sortBy', options.sortBy);
      if (options?.sortOrder) searchParams.append('sortOrder', options.sortOrder);

      const queryString = searchParams.toString();
      const url = queryString ? `${API_ENDPOINTS.EXPENSES}?${queryString}` : API_ENDPOINTS.EXPENSES;

      const response: AxiosResponse<{
        success: boolean;
        data?: ExpenseEntry[];
        error?: string;
      }> = await apiClient.get(url);
      
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
      return await this.handleApiError(
        error, 
        'getExpenses', 
        () => dashboardApiFallback.getExpenses()
      );
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
      return await this.handleApiError(
        error,
        'addExpense',
        () => dashboardApiFallback.addExpense(category, amount, date)
      );
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
      return await this.handleApiError(
        error,
        'updateExpense',
        () => dashboardApiFallback.updateExpense(expenseId, updates)
      );
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
      return await this.handleApiError(
        error,
        'deleteExpense',
        () => dashboardApiFallback.deleteExpense(expenseId)
      );
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
      return await this.handleApiError(
        error,
        'getMonthlyBudget',
        () => dashboardApiFallback.getMonthlyBudget()
      );
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
      return await this.handleApiError(
        error,
        'updateMonthlyBudget',
        () => dashboardApiFallback.updateMonthlyBudget(budget)
      );
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
      return await this.handleApiError(
        error,
        'validateSession',
        () => dashboardApiFallback.validateSession()
      );
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
      return await this.handleApiError(
        error,
        'batchAddExpenses',
        () => dashboardApiFallback.batchAddExpenses(expenses)
      );
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/health');
      return response.status === 200;
    } catch (error) {
      // For health check, don't use fallback, just return false
      if (this.isDevelopment) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Health check failed:', message);
      }
      return false;
    }
  }

  // Reset fallback mode (for testing/development)
  resetFallbackMode(): void {
    this.useFallback = false;
    if (this.isDevelopment) {
      console.log('🔄 Fallback mode reset. Will attempt to use real API again.');
    }
  }

  // Get current environment status
  getStatus(): { environment: string; usingFallback: boolean } {
    return {
      environment: this.isDevelopment ? 'development' : 'production',
      usingFallback: this.useFallback
    };
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