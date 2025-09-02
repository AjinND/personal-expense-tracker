// src/components/auth/AuthenticationPage.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthForm } from './AuthForm';
import { AuthFormData, AuthResponse, AuthMode, User } from '@/types/auth';
import { STORAGE_KEYS } from '@/constants/dashboard';

interface AuthenticationPageProps {
  onAuthenticate: (userData: User) => void;
}

export const AuthenticationPage: React.FC<AuthenticationPageProps> = ({
  onAuthenticate,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle authentication API call
  const handleAuthSubmit = async (formData: AuthFormData): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const action = mode;
      const body = {
        action,
        ...formData,
      };

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        
        toast({
          title: mode === 'login' ? '✓ AUTHORIZED' : '✓ REGISTERED',
          description: data.message || `Welcome to your personal ledger!`,
          duration: 3000,
          className: 'paper-alert typewriter-text',
        });

        onAuthenticate({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          monthlyBudget: data.user.monthlyBudget,
        });

        return { success: true, user: data.user, token: data.token };
      } else {
        toast({
          title: '✗ REJECTED',
          description: data.error || 'Please correct the errors and try again.',
          variant: 'destructive',
          duration: 4000,
          className: 'paper-alert typewriter-text',
        });

        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      const errorMessage = 'System malfunction. Please try again.';
      
      toast({
        title: '⚠ SYSTEM ERROR',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
        className: 'paper-alert typewriter-text',
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
  };

  const formNumber = React.useMemo(() => {
    const base = mode === 'login' ? 'LGN' : 'REG';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `${base}-${dateStr}-${random}`;
  }, [mode]);

  return (
    <div className="auth-page-bg">
      {/* Desk decorations - optimized for viewport */}
      {/* Coffee mug - positioned for viewport */}
      <div className="desk-item hidden md:block" style={{ bottom: '10px', left: '10px' }}>
        <div className="w-16 h-20 relative">
          <div className="absolute bottom-0 w-16 h-16 bg-white rounded-full shadow-lg"
               style={{ background: 'radial-gradient(circle at 30% 30%, #FFFFFF, #F5F5F5)' }}>
            <div className="absolute inset-2 bg-amber-900 rounded-full"
                 style={{ background: 'radial-gradient(circle at 50% 50%, #6F4E37, #3E2723)' }}></div>
          </div>
          <div className="absolute top-6 right-0 w-5 h-10 bg-white"
               style={{ background: 'linear-gradient(to right, #F5F5F5, #FFFFFF, #F5F5F5)',
                        borderRadius: '0 15px 15px 0',
                        boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}></div>
        </div>
      </div>

      {/* Pencil - positioned for viewport */}
      <div className="pencil desk-item hidden lg:block" style={{ top: '80px', right: '30px' }}></div>

      {/* Stack of papers in corner - smaller for viewport */}
      <div className="desk-item hidden md:block" style={{ bottom: '20px', right: '20px' }}>
        <div className="relative" style={{ transform: 'rotate(10deg)' }}>
          <div className="absolute w-32 h-36 bg-white shadow-md" 
               style={{ transform: 'rotate(-5deg) translate(4px, 4px)', background: '#FFF8E7' }}></div>
          <div className="absolute w-32 h-36 bg-white shadow-md" 
               style={{ transform: 'rotate(3deg) translate(2px, 2px)', background: '#FFFEF9' }}></div>
          <div className="w-32 h-36 bg-white shadow-lg relative" style={{ background: 'var(--paper-white)' }}>
            <div className="p-3 text-xs typewriter-text text-gray-400">
              <div>Previous Records:</div>
              <div className="mt-1 text-xs">• Q1 Report</div>
              <div className="text-xs">• Q2 Summary</div>
              <div className="text-xs">• Tax Forms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky notes - positioned for viewport */}
      <div className="sticky-note yellow desk-item hidden lg:block" style={{ top: '40px', left: '60px' }}>
        <div className="text-xs">
          Don't forget!<br/>
          Track daily<br/>
          expenses
        </div>
      </div>

      <div className="sticky-note pink desk-item hidden lg:block" style={{ bottom: '120px', right: '100px' }}>
        <div className="text-xs">
          Budget Goal:<br/>
          Save 20%<br/>
          monthly! 💰
        </div>
      </div>

      {/* Additional desk items - positioned for viewport */}
      <div className="stapler desk-item hidden lg:block" style={{ top: '160px', left: '30px' }}></div>
      <div className="ink-pad desk-item hidden md:block" style={{ bottom: '80px', left: '120px' }}></div>
      <div className="eraser desk-item hidden lg:block" style={{ top: '120px', right: '160px' }}></div>

      <div className="sticky-note blue desk-item hidden md:block" style={{ top: '240px', right: '80px' }}>
        <div className="text-xs">
          Reminder:<br/>
          Review<br/>
          monthly!
        </div>
      </div>

      {/* Main content - optimized for viewport */}
      <div className="main-content-wrapper">
        <div className="notepad-base">
          <div className="spiral-binding"></div>
          <Card className="paper-form-card">
            {/* Ledger lines overlay */}
            <div className="ledger-lines"></div>
            
            {/* Hole punches */}
            <div className="hole-punches"></div>
            
            {/* Paper clip */}
            <div className="paper-clip"></div>
            
            {/* Coffee stain */}
            <div className="coffee-stain" style={{ top: '40px', right: '80px' }}></div>
            
            {/* Form number */}
            <div className="form-number">{formNumber}</div>
            
            <CardContent className="relative p-8">
              {/* Pencil and eraser cursors */}
              <div id="typing-pencil" className="pencil-cursor" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 20 }}>✏️</div>
              <div id="erasing-rubber" className="eraser-cursor" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 20 }}>🧽</div>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="company-stamp mx-auto mb-6">
                  <h1>EXPENSE LEDGER</h1>
                  <div className="tagline">Personal Finance Tracker™</div>
                </div>
                
                <div className="space-y-2">
                  {mode === 'login' ? (
                    <>
                      <h2 className="form-header-text typewriter-text">
                        ACCOUNT ACCESS FORM
                      </h2>
                      <p className="form-header-text handwritten-text">
                        "Every penny counts!"
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="form-header-text typewriter-text">
                        NEW ACCOUNT REGISTRATION
                      </h2>
                      <p className="form-header-text handwritten-text">
                        "Start your financial journey today!"
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative divider */}
              <div className="my-6 flex items-center justify-center">
                <div className="h-px bg-gray-400 flex-1" style={{ background: 'repeating-linear-gradient(90deg, #9E9E9E, #9E9E9E 2px, transparent 2px, transparent 4px)' }}></div>
                <div className="mx-4 text-gray-400 text-2xl">§</div>
                <div className="h-px bg-gray-400 flex-1" style={{ background: 'repeating-linear-gradient(90deg, #9E9E9E, #9E9E9E 2px, transparent 2px, transparent 4px)' }}></div>
              </div>

              {/* Form */}
              <AuthForm
                mode={mode}
                onSubmit={handleAuthSubmit}
                onModeChange={handleModeChange}
                isLoading={isLoading}
              />

              {/* Decorative circular stamp at bottom */}
              <div className="mt-8 flex justify-end">
                <div className="transform rotate-12 opacity-40">
                  <div className="circular-stamp">
                    <div className="stamp-outer-ring">
                      <div className="stamp-inner-content">
                        <div className="stamp-text-top">APPROVED</div>
                        <div className="stamp-center-icon">★</div>
                        <div className="stamp-text-bottom">ACCOUNTING DEPT.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer with retro styling - compact for viewport */}
        <div className="paper-footer">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-6 text-xs typewriter-text">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-600" style={{ 
                  clipPath: 'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)' 
                }}></div>
                <span className="uppercase text-xs">Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1 .9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                  </svg>
                </div>
                <span className="uppercase text-xs">Locked</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-600" style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }}></div>
                <span className="uppercase text-xs">Certified</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 max-w-md mx-auto typewriter-text">
              All financial records are stored in compliance with standard accounting practices.
            </p>
            
            {/* Copyright styled as a stamp */}
            <div className="inline-block mt-2 px-3 py-1 border border-gray-400 typewriter-text text-xs text-gray-500 transform rotate-1">
              © 1985 EXPENSE LEDGER CORP.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};