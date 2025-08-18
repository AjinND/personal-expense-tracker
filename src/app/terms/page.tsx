
// src/app/terms/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last updated: January 1, 2024</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Welcome to Expense Tracker. These terms and conditions outline the rules and 
              regulations for the use of our expense tracking application.
            </p>

            <h3>Acceptance of Terms</h3>
            <p>
              By accessing and using this application, you accept and agree to be bound by 
              the terms and provision of this agreement.
            </p>

            <h3>Use License</h3>
            <p>
              Permission is granted to temporarily use this application for personal, 
              non-commercial transitory viewing only. This is the grant of a license, 
              not a transfer of title.
            </p>

            <h3>User Account</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account 
              and password and for restricting access to your computer.
            </p>

            <h3>Prohibited Uses</h3>
            <p>
              You may not use our application for any unlawful purpose or to solicit 
              others to perform or participate in any unlawful acts.
            </p>

            <h3>Contact Information</h3>
            <p>
              If you have any questions about these Terms of Service, please contact us at 
              legal@expensetracker.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}