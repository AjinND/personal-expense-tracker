// src/components/auth/PasswordInput.tsx
"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { checkPasswordStrength } from '@/lib/auth-validation';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  showStrength?: boolean;
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  placeholder,
  autoComplete = 'current-password',
  required = false,
  showStrength = false,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = showStrength ? checkPasswordStrength(value) : null;

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label 
        htmlFor={id} 
        className={cn(
          'text-sm font-medium transition-colors',
          error ? 'text-red-600' : 'text-gray-700',
          disabled && 'text-gray-400'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Lock className={cn(
            'h-4 w-4 transition-colors',
            error ? 'text-red-500' : 'text-gray-400',
            disabled && 'text-gray-300'
          )} />
        </div>
        
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            'pl-10 pr-12 transition-all duration-200',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2',
            'text-gray-400 hover:text-gray-600 transition-colors',
            'focus:outline-none focus:text-gray-600',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        
        {error && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Password strength indicator */}
      {showStrength && value && passwordStrength && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Password strength:</span>
            <span className={cn(
              'text-xs font-medium',
              passwordStrength.score <= 1 ? 'text-red-600' :
              passwordStrength.score <= 2 ? 'text-orange-600' :
              passwordStrength.score <= 3 ? 'text-yellow-600' :
              'text-green-600'
            )}>
              {getStrengthText(passwordStrength.score)}
            </span>
          </div>
          <Progress 
            value={(passwordStrength.score / 4) * 100} 
            className="h-2"
            // Note: You might need to add custom styles for colored progress bars
          />
          {passwordStrength.feedback.length > 0 && (
            <div className="space-y-1">
              {passwordStrength.feedback.map((feedback, index) => (
                <p key={index} className="text-xs text-gray-500">
                  {feedback}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p 
          id={`${id}-error`}
          className="text-sm text-red-600 flex items-center space-x-1"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};