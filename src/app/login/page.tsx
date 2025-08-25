// src/app/login/page.tsx
"use client";

import React from 'react';
import { AuthGuard, useAuth } from '@/components/auth/AuthGuard';
import { Redirect } from '@/components/common/Redirect';
import { AuthenticationPage } from '@/components/auth/AuthenticationPage';
import { STORAGE_KEYS } from '@/constants/dashboard';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <LoginContent />
    </AuthGuard>
  );
}

function LoginContent() {
  const { user, login } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <AuthenticationPage 
      onAuthenticate={(userData) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || '';
        login(
          {
            id: userData.id || 'user-id',
            name: userData.name,
            email: userData.email,
            monthlyBudget: userData.monthlyBudget
          },
          token
        );
      }} 
    />
  );
}