// src/app/not-found.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Search, LifeBuoy } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const popularPages = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/expenses', label: 'Expenses', icon: Search },
    { href: '/budget', label: 'Budget Planning', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Error illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-blue-200 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <Search className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        <Card className="mb-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              The page you're looking for doesn't exist or has been moved. 
              Don't worry, let's get you back on track!
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </Button>
              <Button asChild>
                <Link href="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </Button>
            </div>

            {/* Popular pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Or visit these popular pages:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {popularPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                    >
                      <Icon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                        {page.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-sm text-gray-500">
          Still having trouble? {' '}
          <Link 
            href="/help" 
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Contact support
          </Link>
          {' '} for assistance.
        </p>
      </div>
    </div>
  );
}