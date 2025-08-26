// src/types/auth.ts
export interface User {
  id: string;
  name: string;
  email: string;
  monthlyBudget?: number;
}

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

export type AuthMode = 'login' | 'register';

export interface ValidationRule {
  test: (value: string, formData?: AuthFormData) => boolean;
  message: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: AuthFormData) => Promise<AuthResponse>;
  onModeChange: () => void;
  isLoading?: boolean;
  className?: string;
}