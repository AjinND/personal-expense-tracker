// src/components/common/LoadingState.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingStateProps } from '@/types/layout';

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className,
  count = 3
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'skeleton') {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={cn(
                "bg-blue-600 rounded-full animate-pulse",
                size === 'sm' && "h-2 w-2",
                size === 'md' && "h-3 w-3",
                size === 'lg' && "h-4 w-4"
              )}
              style={{
                animationDelay: `${index * 150}ms`
              }}
            />
          ))}
        </div>
        {text && (
          <span className={cn("ml-3 text-gray-600", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && (
        <p className={cn("mt-3 text-gray-600", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
};

// Preset loading states for common use cases
export const PageLoadingState = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <LoadingState size="lg" text="Loading..." />
  </div>
);

export const CardLoadingState = () => (
  <div className="p-6">
    <LoadingState variant="skeleton" count={3} />
  </div>
);

export const InlineLoadingState = () => (
  <LoadingState variant="dots" size="sm" />
);

export default LoadingState;