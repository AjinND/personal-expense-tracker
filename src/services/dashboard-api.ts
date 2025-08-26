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
import { debug } from '@/utils/debug'; // Import centralized debug

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Request queue for handling rate limits
interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: any;
  retryCount: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private rateLimitedUntil = 0;

  async enqueue(config: any, retryCount = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, config, retryCount });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    // Check if we're still rate limited
    if (Date.now() < this.rateLimitedUntil) {
      setTimeout(() => this.processQueue(), this.rateLimitedUntil - Date.now());
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;

      try {
        const response = await axios(request.config);
        request.resolve(response);
      } catch (error: any) {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute
          this.rateLimitedUntil = Date.now() + waitTime;

          if (request.retryCount < RETRY_CONFIG.maxRetries) {
            this.queue.unshift({ ...request, retryCount: request.retryCount + 1 });
          } else {
            request.reject(error);
          }
          break;
        } else {
          request.reject(error);
        }
      }
    }

    this.processing = false;

    // Continue processing if there are more items
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
}

const requestQueue = new RequestQueue();

// Axios instance with default configuration
const apiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get fresh token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

// Helper function to check if token exists and is valid format
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  // Basic JWT format check (should have 3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();

      // Debug logging (keep your existing debug code)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Dashboard API Debug:');
        console.log('Looking for token key:', STORAGE_KEYS.AUTH_TOKEN);
        console.log('Token found:', !!token);
        console.log('Token value:', token?.substring(0, 20) + '...');
      }

      if (isValidToken(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (token) {
        // Token exists but is invalid format - clear it
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('user');
        console.warn('Invalid token format detected and cleared');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401) {
      // Clear token and redirect to login - but avoid infinite redirects
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('user');

        // Only redirect if not already on login/auth pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login';
        }
      }
      throw new DashboardError(ERROR_MESSAGES.SESSION_EXPIRED, 'SESSION_EXPIRED', 401);
    }

    if (error.response?.status === 429) {
      // Rate limited - use queue for retry
      if (!originalRequest._queued) {
        originalRequest._queued = true;
        try {
          return await requestQueue.enqueue(originalRequest);
        } catch (queueError) {
          throw new DashboardError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
        }
      }
      throw new DashboardError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
    }

    // Retry logic for certain errors
    if (RETRY_CONFIG.retryableStatuses.includes(error.response?.status || 0)) {
      const retryCount = originalRequest.__retryCount || 0;

      if (retryCount < RETRY_CONFIG.maxRetries) {
        originalRequest.__retryCount = retryCount + 1;

        // Exponential backoff
        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));

        return apiClient(originalRequest);
      }
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

// Request interceptor with centralized debug
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();

      // Centralized debug logging
      debug.api('API Request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
      });

      if (isValidToken(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (token) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('user');
        debug.auth('Invalid token format detected and cleared', { tokenPreview: token.substring(0, 20) + '...' });
      }
    }
    return config;
  },
  (error) => {
    debug.apiError('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor with centralized debug
apiClient.interceptors.response.use(
  (response) => {
    debug.api('API Response Success', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    debug.apiError('API Response Error', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('user');
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          debug.auth('Session expired, redirecting to login', { currentPath });
          window.location.href = '/login';
        }
      }
      throw new DashboardError(ERROR_MESSAGES.SESSION_EXPIRED, 'SESSION_EXPIRED', 401);
    }
    
    if (error.response?.status === 429) {
      if (!originalRequest._queued) {
        originalRequest._queued = true;
        debug.api('Request queued due to rate limit', { url: originalRequest.url });
        try {
          return await requestQueue.enqueue(originalRequest);
        } catch (queueError) {
          debug.apiError('Request queue failed', queueError);
          throw new DashboardError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
        }
      }
      throw new DashboardError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
    }
    
    // Retry logic for certain errors
    if (RETRY_CONFIG.retryableStatuses.includes(error.response?.status || 0)) {
      const retryCount = originalRequest.__retryCount || 0;
      
      if (retryCount < RETRY_CONFIG.maxRetries) {
        originalRequest.__retryCount = retryCount + 1;
        
        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
        debug.api(`Retrying request (${retryCount + 1}/${RETRY_CONFIG.maxRetries})`, {
          url: originalRequest.url,
          delay,
          status: error.response?.status
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
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
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // Check every 30 seconds
  private failureCount = 0; // Track consecutive failures
  private maxFailures = 3; // Max failures before using fallback

  // Improved fallback decision logic with centralized debug
  private async shouldUseFallback(): Promise<boolean> {
    if (!this.isDevelopment) {
      return false;
    }

    if (!this.useFallback) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      debug.api('Testing if API is back online...');
      if (await this.testConnection()) {
        debug.api('API is back online! Disabling fallback mode.');
        this.useFallback = false;
        this.failureCount = 0;
        return false;
      }
      this.lastHealthCheck = now;
    }

    return true;
  }

  // Helper method to handle errors appropriately based on environment
  private async handleApiError(error: any, operation: string, fallbackMethod?: () => Promise<any>): Promise<any> {
    debug.apiError(`Error in ${operation}`, {
      status: error.response?.status,
      message: error.message,
      isInfrastructureError: this.isInfrastructureError(error)
    });

    // In production, never use fallback
    if (!this.isDevelopment) {
      throw error;
    }

    // Handle specific error types
    if (error.response?.status === 401) {
      debug.authWarn('Authentication required');
      throw error;
    }

    if (error.response?.status === 403) {
      debug.authWarn('Access forbidden');
      throw error;
    }

    if (error.response?.status === 400) {
      debug.apiError('Bad request - invalid data format');
      throw error;
    }

    if (error.response?.status === 429) {
      debug.apiError('Rate limit exceeded');
      throw error;
    }

    const isInfrastructureError = this.isInfrastructureError(error);
    
    if (isInfrastructureError) {
      this.failureCount++;
      debug.fallback(`Infrastructure error #${this.failureCount} in ${operation}`);
      
      if (this.failureCount >= this.maxFailures && fallbackMethod) {
        debug.fallback(`Switching to fallback mode after ${this.failureCount} failures`);
        this.useFallback = true;
        this.lastHealthCheck = Date.now();
        return await fallbackMethod();
      } else if (fallbackMethod) {
        debug.fallback(`Using one-time fallback for ${operation} (${this.failureCount}/${this.maxFailures})`);
        return await fallbackMethod();
      }
    }

    if (error.response?.status < 500) {
      this.failureCount = 0;
    }

    throw error;
  }

  // Determine if an error is infrastructure-related (should use fallback) vs application-related (should not)
  private isInfrastructureError(error: any): boolean {
    if (!error.response) {
      debug.api('Network error detected');
      return true;
    }

    if (error.response?.status >= 500) {
      debug.api('Server error detected');
      return true;
    }

    const infrastructureStatusCodes = [408, 502, 503, 504];
    if (infrastructureStatusCodes.includes(error.response?.status)) {
      debug.api('Infrastructure status code detected', { status: error.response.status });
      return true;
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      debug.api('Timeout error detected');
      return true;
    }

    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      debug.api('Connection error detected');
      return true;
    }

    return false;
  }

  // Expenses API with centralized debug
  async getExpenses(options?: {
    startDate?: string;
    endDate?: string; 
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ExpenseEntry[]> {
    const startTime = performance.now();
    
    try {
      if (await this.shouldUseFallback()) {
        debug.fallback('Using fallback for getExpenses');
        const result = await dashboardApiFallback.getExpenses();
        debug.perf('getExpenses_fallback', 'Fallback expenses fetch completed', {
          duration: performance.now() - startTime,
          count: result.length
        });
        return result;
      }

      debug.api('Fetching expenses from API', options);
      
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
      
      const expenses = response.data.data || [];
      debug.api('Successfully fetched expenses', { count: expenses.length });
      debug.perf('getExpenses', 'API expenses fetch completed', {
        duration: performance.now() - startTime,
        count: expenses.length
      });
      
      this.failureCount = 0;
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
      debug.perf('getExpenses_error', 'Expenses fetch failed', {
        duration: performance.now() - startTime
      });
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
  // Budget API methods with centralized debug
  async getMonthlyBudget(): Promise<number> {
    const startTime = performance.now();
    
    try {
      if (await this.shouldUseFallback()) {
        debug.fallback('Using fallback for getMonthlyBudget');
        const result = await dashboardApiFallback.getMonthlyBudget();
        debug.perf('getMonthlyBudget_fallback', 'Fallback budget fetch completed', {
          duration: performance.now() - startTime,
          result
        });
        return result;
      }

      debug.api('Fetching monthly budget from API');
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
      
      const budget = response.data.data?.monthlyBudget || 0;
      debug.api('Successfully fetched budget', { budget });
      debug.perf('getMonthlyBudget', 'API budget fetch completed', {
        duration: performance.now() - startTime,
        budget
      });
      
      this.failureCount = 0;
      return budget;
    } catch (error) {
      debug.perf('getMonthlyBudget_error', 'Budget fetch failed', {
        duration: performance.now() - startTime
      });
      return await this.handleApiError(
        error,
        'getMonthlyBudget',
        () => dashboardApiFallback.getMonthlyBudget()
      );
    }
  }
  async updateMonthlyBudget(budget: number): Promise<number> {
    const startTime = performance.now();
    
    try {
      if (await this.shouldUseFallback()) {
        debug.fallback('Using fallback for updateMonthlyBudget');
        const result = await dashboardApiFallback.updateMonthlyBudget(budget);
        debug.perf('updateMonthlyBudget_fallback', 'Fallback budget update completed', {
          duration: performance.now() - startTime,
          oldBudget: budget,
          newBudget: result
        });
        return result;
      }

      debug.api('Updating monthly budget', { newBudget: budget });
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
      
      const updatedBudget = response.data.data?.budget || budget;
      debug.api('Successfully updated budget', { updatedBudget });
      debug.perf('updateMonthlyBudget', 'API budget update completed', {
        duration: performance.now() - startTime,
        updatedBudget
      });
      
      this.failureCount = 0;
      return updatedBudget;
    } catch (error) {
      debug.perf('updateMonthlyBudget_error', 'Budget update failed', {
        duration: performance.now() - startTime
      });
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
        debug.apiError('Health check failed:', message);
      }
      return false;
    }
  }

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get('/api/health', { timeout: 5000 });
      debug.api('Health check passed', { status: response.status });
      return response.status === 200;
    } catch (error) {
      debug.apiError('Health check failed', error);
      return false;
    }
  }

  // Reset fallback mode (for testing/development)
  resetFallbackMode(): void {
    this.useFallback = false;
    if (this.isDevelopment) {
      debug.api('🔄 Fallback mode reset. Will attempt to use real API again.');
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
  testConnection,
} = dashboardApi;