// src/app/login/page.tsx
"use client";

import React from 'react';
import { AuthGuard, useAuth } from '@/components/auth/AuthGuard';
import AuthenticationPage from '@/components/login/login';
import { Redirect } from '@/components/common/Redirect';

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
        const token = localStorage.getItem('token') || '';
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