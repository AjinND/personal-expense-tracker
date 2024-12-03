"use client";

import ExpenseDashboard from "@/components/dashboard/expenseDashboard";
import AuthenticationPage from "@/components/login/login";
import React, { useState } from "react";

type User = {
  name: string;
  email: string;
};
const AppWrapper = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleAuthenticate = (userData: React.SetStateAction<User | null>) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If no user is authenticated, show login page
  if (!user) {
    return <AuthenticationPage onAuthenticate={handleAuthenticate} />;
  }

  // If user is authenticated, show dashboard (or main app)
  return <ExpenseDashboard user={user} onLogout={handleLogout} />;
};

export default AppWrapper;
