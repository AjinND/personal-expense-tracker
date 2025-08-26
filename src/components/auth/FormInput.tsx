// src/components/auth/FormInput.tsx
"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FormInputProps } from '@/types/components';

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  placeholder,
  icon: Icon,
  autoComplete,
  required = false,
  className,
}) => {
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
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <Icon className={cn(
              'h-4 w-4 transition-colors',
              error ? 'text-red-500' : 'text-gray-400',
              disabled && 'text-gray-300'
            )} />
          </div>
        )}
        
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            'transition-all duration-200',
            Icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      
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