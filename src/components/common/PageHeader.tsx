// src/components/common/PageHeader.tsx
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeaderProps } from '@/types/layout';

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
      className
    )}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              {title}
              {badge && (
                <Badge 
                  variant={badge.variant || 'default'} 
                  className={badge.className}
                >
                  {badge.text}
                </Badge>
              )}
            </h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;