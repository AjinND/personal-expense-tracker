// src/components/login/login.tsx
"use client";

import React from 'react';
import { AuthenticationPage } from '../auth/AuthenticationPage';

interface AuthenticationPageWrapperProps {
  onAuthenticate: (userdata: { name: string; email: string }) => void;
}

// This is a wrapper to maintain compatibility with your existing app structure
const AuthenticationPageWrapper: React.FC<AuthenticationPageWrapperProps> = ({ 
  onAuthenticate 
}) => {
  return (
    <AuthenticationPage 
      onAuthenticate={(user) => {
        // Transform the user data to match the expected format
        onAuthenticate({
          name: user.name,
          email: user.email,
        });
      }} 
    />
  );
};

export default AuthenticationPageWrapper;