// src/components/navigation/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Home,
  CreditCard, 
  PieChart, 
  Target, 
  BarChart3, 
  Calendar,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  FileText,
  Bell,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentPath?: string;
  user: { name: string; email?: string };
  onLogout: () => void;
  className?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  description?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPath = '/', 
  user, 
  onLogout,
  className 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { 
          label: 'Dashboard', 
          href: '/', 
          icon: Home,
          description: 'Overview and quick stats' 
        },
        { 
          label: 'Analytics', 
          href: '/analytics', 
          icon: TrendingUp,
          badge: 'New',
          description: 'Detailed insights and trends' 
        },
      ]
    },
    {
      title: 'Manage',
      items: [
        { 
          label: 'Expenses', 
          href: '/expenses', 
          icon: CreditCard,
          description: 'Track and manage expenses' 
        },
        { 
          label: 'Budget', 
          href: '/budget', 
          icon: Target,
          description: 'Set and monitor budgets' 
        },
        { 
          label: 'Categories', 
          href: '/categories', 
          icon: PieChart,
          description: 'Organize spending categories' 
        },
      ]
    },
    {
      title: 'Reports',
      items: [
        { 
          label: 'Monthly Reports', 
          href: '/reports', 
          icon: BarChart3,
          description: 'Generate detailed reports' 
        },
        { 
          label: 'Calendar View', 
          href: '/calendar', 
          icon: Calendar,
          description: 'View expenses by date' 
        },
        { 
          label: 'Export Data', 
          href: '/export', 
          icon: FileText,
          description: 'Download your data' 
        },
      ]
    }
  ];

  const bottomItems: NavItem[] = [
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: 3 },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help', href: '/help', icon: HelpCircle },
  ];

  const isActivePage = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      "h-screen sticky top-0",
      className
    )}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Wallet className="text-blue-600 h-8 w-8" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Expense Tracker</h1>
                <p className="text-xs text-gray-500">Smart Financial Management</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getUserInitials(user.name)}
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'user@example.com'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePage(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "mx-2 flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                      isActive 
                        ? "bg-blue-100 text-blue-700 shadow-sm" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "flex-shrink-0 transition-colors",
                      isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                      isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
                    )} />
                    
                    {!isCollapsed && (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        {item.badge && (
                          <span className="ml-2 bg-red-500 px-1 py-0.5 rounded-full text-xs">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 p-2">
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePage(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
                )} />
                
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Logout Button */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 group relative"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className={cn(
              "flex-shrink-0",
              isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
            )} />
            
            {!isCollapsed && <span>Sign Out</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;