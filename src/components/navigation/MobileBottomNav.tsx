// src/components/navigation/MobileBottomNav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  CreditCard, 
  PieChart, 
  Target, 
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const bottomNavItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: CreditCard,
  },
  {
    label: 'Add',
    href: '/add-expense',
    icon: Plus,
    isSpecial: true, // This will be styled differently
  },
  {
    label: 'Budget',
    href: '/budget',
    icon: Target,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: PieChart,
  },
];

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          if (item.isSpecial) {
            // Special styling for the "Add" button
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center p-2"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg transform -translate-y-2">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-gray-500"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 mb-1",
                isActive && "text-blue-600"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-blue-600"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};