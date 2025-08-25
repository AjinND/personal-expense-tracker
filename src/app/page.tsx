// src/app/page.tsx
"use client";

import React from 'react';
import { AuthGuard, useAuth } from '@/components/auth/AuthGuard';
import { Redirect } from '@/components/common/Redirect';
import { AuthenticationPage } from '@/components/auth/AuthenticationPage';
import { STORAGE_KEYS } from '@/constants/dashboard';

export default function HomePage() {
  return (
    <AuthGuard requireAuth={false}>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  const { user, loading, login } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  // Show authentication page
  return (
    <AuthenticationPage 
      onAuthenticate={(userData) => {
        // The authentication page should handle the login
        // This is passed for compatibility
        login(
          {
            id: userData.id || 'user-id',
            name: userData.name,
            email: userData.email,
            monthlyBudget: userData.monthlyBudget
          },
          localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || ''
        );
      }} 
    />
  );
}