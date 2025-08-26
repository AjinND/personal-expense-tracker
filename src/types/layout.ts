// src/types/layout.ts
import { LucideIcon } from 'lucide-react';
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
  variant?: 'spinner' | 'skeleton' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  count?: number; // For skeleton variant
}
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: any;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  };
  actions?: React.ReactNode;
  className?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}