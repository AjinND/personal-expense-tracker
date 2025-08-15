// src/components/auth/PasswordInput.tsx
"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { checkPasswordStrength } from '@/lib/auth-validation';
import { PasswordStrength } from '@/types/auth';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  showStrength?: boolean;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<{ strength: PasswordStrength }> = ({ 
  strength 
}) => {
  const getStrengthColor = (score: number): string => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getStrengthText = (score: number): string => {
    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return levels[Math.min(score, 4)];
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              level <= strength.score
                ? getStrengthColor(strength.score)
                : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      
      {/* Strength text and feedback */}
      <div className="space-y-1">
        <p className={cn(
          'text-xs font-medium',
          strength.score <= 1 && 'text-red-600',
          strength.score === 2 && 'text-orange-600',
          strength.score === 3 && 'text-yellow-600',
          strength.score >= 4 && 'text-green-600'
        )}>
          Strength: {getStrengthText(strength.score)}
        </p>
        
        {strength.feedback.length > 0 && (
          <ul className="text-xs text-gray-600 space-y-0.5">
            {strength.feedback.map((item, index) => (
              <li key={index} className="flex items-center space-x-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  placeholder = "Enter your password",
  showStrength = false,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const passwordStrength = showStrength ? checkPasswordStrength(value) : null;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-10 transition-all duration-200',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            isFocused && !error && 'border-blue-500 ring-2 ring-blue-500/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(
            'absolute inset-y-0 right-0 pr-3 flex items-center',
            'text-gray-400 hover:text-gray-600 transition-colors',
            disabled && 'pointer-events-none'
          )}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 flex items-center space-x-1">
          <span className="w-1 h-1 bg-red-600 rounded-full" />
          <span>{error}</span>
        </p>
      )}

      {/* Password strength indicator */}
      {showStrength && passwordStrength && value.length > 0 && !error && (
        <PasswordStrengthIndicator strength={passwordStrength} />
      )}
    </div>
  );
};