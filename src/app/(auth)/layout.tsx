// src/app/(auth)/layout.tsx
'use client';

import React from 'react';
import { AuthGuard, useAuth } from '@/components/auth/AuthGuard';
import { DashboardProvider } from '@/contexts/DashboardContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DebugPanel } from '@/components/debug/DebugPanel';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true}>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </AuthGuard>
  );
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  if (!user) {
    return null; // AuthGuard handles redirect
  }

  return (
    <DashboardProvider onLogout={logout}>
      <DashboardLayout user={user} onLogout={logout}>
        {children}
      </DashboardLayout>
      <DebugPanel />
    </DashboardProvider>
  );
}