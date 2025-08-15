// src/components/auth/AuthForm.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Mail, User } from 'lucide-react';
import { FormInput } from './FormInput';
import { PasswordInput } from './PasswordInput';
import { validateForm, validateField } from '@/lib/auth-validation';
import { AuthFormData, FormErrors, AuthMode, AuthResponse } from '@/types/auth';
import { cn } from '@/lib/utils';

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: AuthFormData) => Promise<AuthResponse>;
  onModeChange: () => void;
  isLoading?: boolean;
  className?: string;
}

const initialFormData: AuthFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
};

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onModeChange,
  isLoading = false,
  className,
}) => {
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof AuthFormData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle field blur (for real-time validation)
  const handleFieldBlur = useCallback((field: keyof AuthFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    
    const error = validateField(field, formData[field], formData);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors = validateForm(formData, mode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Mark all fields as touched
      setTouchedFields(new Set(Object.keys(formData) as (keyof AuthFormData)[]));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await onSubmit(formData);
      
      if (!result.success) {
        setErrors({ general: result.error || 'Authentication failed' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mode change
  const handleModeChange = () => {
    setFormData(initialFormData);
    setErrors({});
    setTouchedFields(new Set());
    onModeChange();
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)} noValidate>
      {/* Name field (only for registration) */}
      {mode === 'register' && (
        <FormInput
          id="name"
          label="Full Name"
          value={formData.name}
          onChange={(value) => handleFieldChange('name', value)}
          onBlur={() => handleFieldBlur('name')}
          error={touchedFields.has('name') ? errors.name : undefined}
          disabled={isFormDisabled}
          placeholder="Enter your full name"
          icon={User}
          autoComplete="name"
          required
        />
      )}

      {/* Email field */}
      <FormInput
        id="email"
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(value) => handleFieldChange('email', value)}
        onBlur={() => handleFieldBlur('email')}
        error={touchedFields.has('email') ? errors.email : undefined}
        disabled={isFormDisabled}
        placeholder="Enter your email address"
        icon={Mail}
        autoComplete="email"
        required
      />

      {/* Password field */}
      <PasswordInput
        id="password"
        label="Password"
        value={formData.password}
        onChange={(value) => handleFieldChange('password', value)}
        onBlur={() => handleFieldBlur('password')}
        error={touchedFields.has('password') ? errors.password : undefined}
        disabled={isFormDisabled}
        placeholder={mode === 'login' ? 'Enter your password' : 'Create a secure password'}
        showStrength={mode === 'register'}
      />

      {/* Confirm password field (only for registration) */}
      {mode === 'register' && (
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={(value) => handleFieldChange('confirmPassword', value)}
          onBlur={() => handleFieldBlur('confirmPassword')}
          error={touchedFields.has('confirmPassword') ? errors.confirmPassword : undefined}
          disabled={isFormDisabled}
          placeholder="Confirm your password"
        />
      )}

      {/* General error message */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isFormDisabled}
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
          </>
        ) : (
          mode === 'login' ? 'Sign In' : 'Create Account'
        )}
      </Button>

      {/* Mode toggle */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        </p>
        <Button
          type="button"
          variant="link"
          onClick={handleModeChange}
          disabled={isFormDisabled}
          className="font-medium"
        >
          {mode === 'login' ? 'Create an account' : 'Sign in instead'}
        </Button>
      </div>

      {/* Forgot password (only for login) */}
      {mode === 'login' && (
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={isFormDisabled}
            className="text-sm text-gray-600 hover:text-gray-800"
            onClick={() => {
              // TODO: Implement forgot password functionality
              console.log('Forgot password clicked');
            }}
          >
            Forgot your password?
          </Button>
        </div>
      )}
    </form>
  );
};