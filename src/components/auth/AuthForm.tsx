// src/components/auth/AuthForm.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Mail, User, Eye, EyeOff } from 'lucide-react';
import { validateForm, validateField } from '@/lib/auth-validation';
import { AuthFormData, FormErrors, AuthFormProps } from '@/types/auth';
import { cn } from '@/lib/utils';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Pencil and eraser animation effect
  useEffect(() => {
    const inputs = document.querySelectorAll('.paper-input') as NodeListOf<HTMLInputElement>;
    let pencil: HTMLElement;
    let eraser: HTMLElement;
    let currentInput: HTMLInputElement | null = null;
    let eraseTimer: NodeJS.Timeout | null = null;

    // Setup cursor function
    function setupCursor(id: string, emoji: string, className: string): HTMLElement {
      let cursor = document.getElementById(id);
      if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = id;
        cursor.className = className;
        cursor.textContent = emoji;
      }
      cursor.style.cssText = `
        display: none;
        position: fixed;
        pointer-events: none;
        z-index: 1000;
        font-size: 20px;
      `;
      document.body.appendChild(cursor); // Append or move to body
      return cursor;
    }

    pencil = setupCursor('typing-pencil', '✏️', 'pencil-cursor');
    eraser = setupCursor('erasing-rubber', '🧽', 'eraser-cursor');

    const handleFocus = (e: Event) => {
      currentInput = e.target as HTMLInputElement;
      updatePencilPosition();
      pencil.style.display = 'block';
      eraser.style.display = 'none';
    };

    const handleBlur = () => {
      currentInput = null;
      pencil.style.display = 'none';
      eraser.style.display = 'none';
    };

    const handleInput = () => {
      if (currentInput) {
        updatePencilPosition();
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && currentInput && currentInput.value.length > 0) {
        pencil.style.display = 'none';
        eraser.style.display = 'block';
        updateEraserPosition();
        if (eraseTimer) clearTimeout(eraseTimer);
        eraseTimer = setTimeout(() => {
          eraser.style.display = 'none';
          if (currentInput) {
            pencil.style.display = 'block';
            updatePencilPosition();
          }
        }, 500);
      }
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        setTimeout(updatePencilPosition, 0);
      }
    };

    const handleMouseUp = () => {
      if (currentInput) {
        updatePencilPosition();
      }
    };

    inputs.forEach((input) => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('input', handleInput);
      input.addEventListener('keydown', handleKeydown);
      input.addEventListener('mouseup', handleMouseUp);
    });

    function getTextWidth(text: string, input: HTMLInputElement): number {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = getComputedStyle(input).font;
        const measureText = input.type === 'password' ? '•'.repeat(text.length) : text;
        return context.measureText(measureText).width;
      }
      return text.length * 12; // fallback
    }

    function updatePencilPosition() {
      if (!currentInput) return;
      const rect = currentInput.getBoundingClientRect();
      const position = currentInput.selectionStart ?? currentInput.value.length;
      const textBefore = currentInput.value.substring(0, position);
      const textWidth = getTextWidth(textBefore, currentInput);
      const left = rect.left + textWidth + 5; // Adjusted offset
      const top = rect.top + (rect.height / 2) - 12;
      pencil.style.left = `${left}px`;
      pencil.style.top = `${top}px`;
    }

    function updateEraserPosition() {
      if (!currentInput) return;
      const rect = currentInput.getBoundingClientRect();
      const position = (currentInput.selectionStart ?? currentInput.value.length) - 1;
      if (position < 0) return;
      const textBefore = currentInput.value.substring(0, position);
      const textWidth = getTextWidth(textBefore, currentInput);
      const left = rect.left + textWidth + 5;
      const top = rect.top + (rect.height / 2) - 12;
      eraser.style.left = `${left}px`;
      eraser.style.top = `${top}px`;
    }

    const handleUpdate = () => {
      if (currentInput) {
        if (pencil.style.display === 'block') {
          updatePencilPosition();
        } else if (eraser.style.display === 'block') {
          updateEraserPosition();
        }
      }
    };

    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
        input.removeEventListener('input', handleInput);
        input.removeEventListener('keydown', handleKeydown);
        input.removeEventListener('mouseup', handleMouseUp);
      });
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      if (eraseTimer) {
        clearTimeout(eraseTimer);
      }
    };
  }, [mode]);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)} noValidate>
      {/* Name field (only for registration) */}
      {mode === 'register' && (
        <div className="space-y-2">
          <label htmlFor="name" className="form-label-typewriter">
            <User className="inline w-3 h-3 mr-1" />
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={() => handleFieldBlur('name')}
            disabled={isFormDisabled}
            placeholder="ENTER YOUR FULL NAME"
            className="paper-input w-full"
            autoComplete="name"
            required
          />
          {touchedFields.has('name') && errors.name && (
            <div className="error-correction">{errors.name}</div>
          )}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="form-label-typewriter">
          <Mail className="inline w-3 h-3 mr-1" />
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          disabled={isFormDisabled}
          placeholder="ENTER YOUR EMAIL ADDRESS"
          className="paper-input w-full"
          autoComplete="email"
          required
        />
        {touchedFields.has('email') && errors.email && (
          <div className="error-correction">{errors.email}</div>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="form-label-typewriter">
          Password *
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            disabled={isFormDisabled}
            placeholder={mode === 'login' ? 'ENTER YOUR PASSWORD' : 'CREATE A SECURE PASSWORD'}
            className="paper-input w-full pr-10"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={isFormDisabled}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {touchedFields.has('password') && errors.password && (
          <div className="error-correction">{errors.password}</div>
        )}
      </div>

      {/* Confirm password field (only for registration) */}
      {mode === 'register' && (
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="form-label-typewriter">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
              onBlur={() => handleFieldBlur('confirmPassword')}
              disabled={isFormDisabled}
              placeholder="CONFIRM YOUR PASSWORD"
              className="paper-input w-full pr-10"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isFormDisabled}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {touchedFields.has('confirmPassword') && errors.confirmPassword && (
            <div className="error-correction">{errors.confirmPassword}</div>
          )}
        </div>
      )}

      {/* General error message */}
      {errors.general && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 typewriter-text">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="stamp-button w-full"
        disabled={isFormDisabled}
      >
        {isSubmitting ? (
          <>
            <div className="inline-block w-4 h-4 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {mode === 'login' ? 'VERIFYING...' : 'REGISTERING...'}
          </>
        ) : (
          mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'
        )}
      </button>

      {/* Mode toggle */}
      <div className="text-center space-y-3 mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" style={{ 
              borderStyle: 'dashed' 
            }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500 typewriter-text">
              {mode === 'login' ? "NEW TO THE SYSTEM?" : 'ALREADY REGISTERED?'}
            </span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleModeChange}
          disabled={isFormDisabled}
          className="text-blue-600 hover:text-blue-800 underline typewriter-text text-sm font-bold tracking-wider transition-colors"
        >
          {mode === 'login' ? 'CREATE NEW ACCOUNT' : 'SIGN IN TO EXISTING ACCOUNT'}
        </button>
      </div>

      {/* Forgot password (only for login) */}
      {mode === 'login' && (
        <div className="text-center mt-4">
          <button
            type="button"
            disabled={isFormDisabled}
            className="text-xs text-gray-500 hover:text-gray-700 typewriter-text tracking-wide transition-colors"
            onClick={() => {
              // TODO: Implement forgot password functionality
              console.log('Forgot password clicked');
            }}
          >
            FORGOT PASSWORD? CONTACT ADMINISTRATOR
          </button>
        </div>
      )}

      {/* Retro certification footer */}
      <div className="mt-8 pt-4 border-t border-dashed border-gray-300">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 text-xs typewriter-text text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>SSL SECURED</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>ENCRYPTED</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};