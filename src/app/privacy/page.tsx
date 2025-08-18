
// src/app/privacy/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: January 1, 2024</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              At Expense Tracker, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, and protect your personal information when you use our expense tracking application.
            </p>

            <h3>Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as when you create an account, 
              add expenses, or contact us for support. This may include your name, email address, 
              and financial data you choose to track.
            </p>

            <h3>How We Use Your Information</h3>
            <p>
              We use the information we collect to provide, maintain, and improve our services, 
              including to process transactions, send you updates, and provide customer support.
            </p>

            <h3>Data Security</h3>
            <p>
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3>Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at 
              privacy@expensetracker.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
