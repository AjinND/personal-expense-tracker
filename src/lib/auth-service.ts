// src/lib/auth-service.ts
import { STORAGE_KEYS } from '@/constants/dashboard';
import { AuthFormData, AuthResponse, User } from '@/types/auth';

class AuthService {
  private baseUrl = '/api/auth';

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.makeAuthRequest({
      action: 'login',
      email,
      password,
      name: '',
      confirmPassword: '',
    });
  }

  async register(userData: Omit<AuthFormData, 'action'>): Promise<AuthResponse> {
    return this.makeAuthRequest({
      action: 'register',
      ...userData,
    });
  }

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('token');
    
    // Optionally call logout endpoint if you implement server-side session management
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
  }

  async validateSession(): Promise<{ valid: boolean; user?: User }> {
    const token = this.getToken();
    if (!token) {
      return { valid: false };
    }

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return {
          valid: true,
          user: {
            id: data.userData.id,
            name: data.userData.name,
            email: data.userData.email,
          },
        };
      } else {
        // Token is invalid, remove it
        this.logout();
        return { valid: false };
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      this.logout();
      return { valid: false };
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private async makeAuthRequest(data: AuthFormData & { action: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.token) {
        // Store token
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      }

      return result;
    } catch (error) {
      console.error('Auth request failed:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }
}

export const authService = new AuthService();