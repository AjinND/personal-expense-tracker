// src/app/login/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticationPage } from '@/components/auth/AuthenticationPage';
import { User } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to dashboard if already authenticated
      router.push('/');
    }
  }, [router]);

  const handleAuthenticate = (userData: User) => {
    // Store user data and redirect to dashboard
    localStorage.setItem('user', JSON.stringify(userData));
    router.push('/');
  };

  return (
    <div className="min-h-screen">
      <AuthenticationPage onAuthenticate={handleAuthenticate} />
    </div>
  );
}