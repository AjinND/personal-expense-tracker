// src/types/components.ts
import { ReactNode } from 'react';
import { User, DashboardMetrics, ExpenseEntry, CategoryTotals, ExpenseCategory } from './dashboard';

// Dashboard Component Props
export interface ExpenseDashboardProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

export interface DashboardHeaderProps {
  user: User;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
}

export interface ExpenseSummaryProps {
  metrics: DashboardMetrics;
  totalBalance: number;
  onBudgetUpdate: (budget: number) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export interface CategoryCardsProps {
  categoryTotals: CategoryTotals;
  onAddExpense: (category: ExpenseCategory, amount: number, date: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export interface DashboardChartsProps {
  expenses: ExpenseEntry[];
  categoryTotals: CategoryTotals;
  dateRange: any; // DateRange from react-day-picker
  onDateRangeChange: (range: any) => void;
  loading?: boolean;
  className?: string;
}

// Form Component Props
export interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: Partial<ExpenseFormData>;
  isLoading?: boolean;
  className?: string;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
}

export interface BudgetFormProps {
  currentBudget: number;
  onSubmit: (budget: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// UI Component Props
export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// Error Component Props
export interface ErrorAlertProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

// Chart Component Props
export interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface LineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
  className?: string;
}

export interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
  className?: string;
}

// Modal Component Props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

// Notification Props
export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
  action?: ReactNode;
}

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

// Search Component Props
export interface SearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  loading?: boolean;
  className?: string;
}

export interface FilterProps {
  filters: Array<{
    key: string;
    label: string;
    options: Array<{
      value: string;
      label: string;
      count?: number;
    }>;
  }>;
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  className?: string;
}

// Data Table Props
export interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => ReactNode;
    sortable?: boolean;
    width?: string;
  }>;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  selection?: {
    selectedItems: T[];
    onSelectionChange: (items: T[]) => void;
  };
  actions?: Array<{
    label: string;
    onClick: (item: T) => void;
    icon?: ReactNode;
    variant?: 'default' | 'destructive';
  }>;
  className?: string;
}