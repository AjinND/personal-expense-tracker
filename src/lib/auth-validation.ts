// src/lib/auth-validation.ts
import { AuthFormData, FormErrors, PasswordStrength, ValidationRule } from '@/types/auth';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

// Password strength checker
export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters');
  }

  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthLevel = strengthLevels[Math.min(score, 4)];

  return {
    score,
    feedback: score < 3 ? feedback : [`Password strength: ${strengthLevel}`],
    isValid: score >= 3,
  };
};

// Validation rules
export const validationRules: Record<keyof Omit<AuthFormData, 'confirmPassword'>, ValidationRule[]> = {
  email: [
    {
      test: (value) => value.trim().length > 0,
      message: 'Email is required',
    },
    {
      test: (value) => validateEmail(value),
      message: 'Please enter a valid email address',
    },
  ],
  password: [
    {
      test: (value) => value.length > 0,
      message: 'Password is required',
    },
    {
      test: (value) => checkPasswordStrength(value).isValid,
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    },
  ],
  name: [
    {
      test: (value) => value.trim().length > 0,
      message: 'Name is required',
    },
    {
      test: (value) => value.trim().length >= 2,
      message: 'Name must be at least 2 characters',
    },
    {
      test: (value) => value.trim().length <= 50,
      message: 'Name must be less than 50 characters',
    },
    {
      test: (value) => /^[a-zA-Z\s]+$/.test(value.trim()),
      message: 'Name can only contain letters and spaces',
    },
  ],
};

// Form validation function
export const validateForm = (
  formData: AuthFormData,
  mode: 'login' | 'register'
): FormErrors => {
  const errors: FormErrors = {};

  // Validate email
  for (const rule of validationRules.email) {
    if (!rule.test(formData.email)) {
      errors.email = rule.message;
      break;
    }
  }

  // Validate password
  for (const rule of validationRules.password) {
    if (!rule.test(formData.password)) {
      errors.password = rule.message;
      break;
    }
  }

  // Registration-specific validations
  if (mode === 'register') {
    // Validate name
    for (const rule of validationRules.name) {
      if (!rule.test(formData.name)) {
        errors.name = rule.message;
        break;
      }
    }

    // Validate password confirmation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
};

// Field validation function for real-time validation
export const validateField = (
  field: keyof AuthFormData,
  value: string,
  formData?: AuthFormData
): string | undefined => {
  if (field === 'confirmPassword' && formData) {
    if (!value) return 'Please confirm your password';
    if (value !== formData.password) return 'Passwords do not match';
    return undefined;
  }

  if (field in validationRules) {
    const rules = validationRules[field as keyof typeof validationRules];
    for (const rule of rules) {
      if (!rule.test(value, formData)) {
        return rule.message;
      }
    }
  }

  return undefined;
};