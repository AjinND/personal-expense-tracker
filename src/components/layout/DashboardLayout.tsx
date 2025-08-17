// src/components/layout/DashboardLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/navigation/Navigation';
import Sidebar from '@/components/navigation/Sidebar';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Menu, X, BarChart3, CreditCard, PieChart, Target, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: { 
    name: string; 
    email?: string;
    avatar?: string;
  };
  onLogout: () => void;
  showSidebar?: boolean;
  className?: string;
}

// Route configuration for breadcrumbs
const routeConfig: Record<string, { label: string; icon?: React.ComponentType<any> }> = {
  '/': { label: 'Dashboard', icon: BarChart3 },
  '/expenses': { label: 'Expenses', icon: CreditCard },
  '/budget': { label: 'Budget', icon: Target },
  '/analytics': { label: 'Analytics', icon: PieChart },
  '/reports': { label: 'Reports', icon: FileText },
  '/calendar': { label: 'Calendar', icon: Calendar },
  '/settings': { label: 'Settings' },
  '/profile': { label: 'Profile' },
  '/help': { label: 'Help & Support' },
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  onLogout,
  showSidebar = true,
  className
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(showSidebar);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(showSidebar);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [showSidebar]);

  // Generate breadcrumb items from current path
  interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ComponentType<any>;
  }

  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add root if not on home page
    if (path !== '/') {
      breadcrumbs.push({
        label: routeConfig['/']?.label || 'Dashboard',
        href: '/',
        icon: routeConfig['/']?.icon
      });
    }

    // Add path segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const config = routeConfig[currentPath];
      
      if (config) {
        breadcrumbs.push({
          label: config.label,
          href: index === segments.length - 1 ? undefined : currentPath, // Don't make last item clickable
          icon: config.icon
        });
      } else {
        // Fallback for dynamic routes
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          href: index === segments.length - 1 ? undefined : currentPath
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs(pathname);

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Top Navigation */}
      <Navigation 
        user={user} 
        onLogout={onLogout} 
        currentPath={pathname}
      />

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <div className={cn(
              "hidden lg:block transition-all duration-300",
              isSidebarOpen ? "w-64" : "w-0"
            )}>
              {isSidebarOpen && (
                <Sidebar 
                  currentPath={pathname}
                  user={user}
                  onLogout={onLogout}
                />
              )}
            </div>

            {/* Mobile Sidebar */}
            {isMobile && isSidebarOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                />
                <div className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden">
                  <Sidebar 
                    currentPath={pathname}
                    user={user}
                    onLogout={onLogout}
                  />
                </div>
              </>
            )}

            {/* Sidebar Toggle Button */}
            <div className="fixed bottom-6 left-6 z-30">
              <Button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full p-3"
              >
                {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Breadcrumb Navigation */}
          {breadcrumbItems.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
              <div className="max-w-7xl mx-auto">
                <Breadcrumb 
                  items={breadcrumbItems}
                  showHome={pathname !== '/'}
                />
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>© 2024 Expense Tracker</span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline">Smart Financial Management</span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <a href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Terms of Service
                  </a>
                  <a href="/help" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Help
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;