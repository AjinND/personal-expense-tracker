// src/components/ui/page-header.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
  className
}) => {
  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && <Icon className="h-6 w-6 text-blue-600" />}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};