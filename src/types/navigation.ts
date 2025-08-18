// src/types/navigation.ts
import { ReactNode, ComponentType } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ComponentType<any>;
}

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<any>;
  badge?: string | number;
  description?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavigationProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  onLogout: () => void;
  currentPath?: string;
  className?: string;
}

export interface SidebarProps {
  currentPath?: string;
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  onLogout: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  separator?: ReactNode;
  className?: string;
}

export interface RouteConfig {
  [path: string]: {
    label: string;
    icon?: ComponentType<any>;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
  };
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  user: NavigationProps['user'];
  onLogout: () => void;
}

export interface UserMenuProps {
  user: NavigationProps['user'];
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}