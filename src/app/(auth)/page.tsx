// src/app/(auth)/page.tsx
"use client";

import React from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import ExpenseDashboard from '@/components/dashboard/ExpenseDashboard ';

export default function AuthenticatedHomePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return null; // AuthGuard handles redirect
  }

  return <ExpenseDashboard user={user} onLogout={logout} />;
}