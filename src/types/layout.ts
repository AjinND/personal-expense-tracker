// src/types/layout.ts
import { ReactNode } from 'react';

export interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  onLogout: () => void;
  showSidebar?: boolean;
  className?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showLogo?: boolean;
  className?: string;
}

export interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export interface HeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  user?: {
    name: string;
    email?: string;
  };
  onLogout?: () => void;
  showUserMenu?: boolean;
}

export interface FooterProps {
  showLinks?: boolean;
  className?: string;
  companyName?: string;
  currentYear?: number;
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
}

export interface ThemeContextProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
}

export interface LoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
  overlay?: boolean;
  className?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}