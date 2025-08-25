// src/components/providers/AppProviders.tsx
'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { DashboardProvider } from '@/contexts/DashboardContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const { user, logout } = useAuth();

  // Only provide dashboard context if user is authenticated
  if (!user) {
    return <>{children}</>;
  }

  return (
    <DashboardProvider onLogout={logout}>
      {children}
    </DashboardProvider>
  );
};

// Update your main layout file (e.g., src/app/layout.tsx or your dashboard layout)
// Wrap your authenticated pages with AppProviders:

/*
// Example usage in layout.tsx:

import { AppProviders } from '@/components/providers/AppProviders';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>
          <AppProviders>
            {children}
          </AppProviders>
        </AuthGuard>
      </body>
    </html>
  );
}
*/