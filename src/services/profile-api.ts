// src/services/profile-api.ts
import axios from 'axios';
import { ApiResponse } from '@/types/dashboard';
import { ActivityLogResponse, PasswordChangeData } from '@/types/profile';
import { STORAGE_KEYS } from '@/constants/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ensure Content-Type is set for all requests
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const profileApi = {
  // Password change
  changePassword: async (data: PasswordChangeData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post('/profile/password', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to change password' };
    }
  },

  // Email verification
  sendVerificationEmail: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post('/profile/verify-email');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to send verification email' };
    }
  },

  // Confirm email verification
  confirmEmailVerification: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post('/profile/verify-email/confirm', { token });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to verify email' };
    }
  },

  // Delete account
  deleteAccount: async (password: string, confirmation: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.delete('/profile/delete', {
        data: { password, confirmation }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete account' };
    }
  },

  // Get activity logs
  getActivityLogs: async (page: number = 1, limit: number = 20): Promise<ActivityLogResponse> => {
    try {
      const response = await apiClient.get('/profile/activity', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch activity logs' };
    }
  },

  // Update profile
  updateProfile: async (data: { name?: string; email?: string; monthlyBudget?: number }): Promise<ApiResponse> => {
    try {
      const response = await apiClient.put('/profile', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },
};

