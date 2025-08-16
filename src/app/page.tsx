"use client";

import ExpenseDashboard from "@/components/dashboard/ExpenseDashboard ";
import AuthenticationPage from "@/components/login/login";
import axios from "axios";
import React, { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  monthlyBudget?: number;
};

const AppWrapper = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken(token: string) {
      try {
        console.log('Validating token...');
        const response = await axios.post(
          "/api/auth/session",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000, // 10 second timeout
          }
        );
        
        if (response.data.success) {
          console.log('Token validated successfully:', response.data.userData);
          const userData = response.data.userData;
          
          // Ensure user data has all required fields
          const user: User = {
            id: userData.id || userData._id || 'user-id',
            name: userData.name || 'User',
            email: userData.email || 'user@example.com',
            monthlyBudget: userData.monthlyBudget || 0,
          };
          
          setUser(user);
          setError(null);
        } else {
          console.warn('Token validation failed:', response.data.error);
          localStorage.removeItem("token");
          setUser(null);
          setError(response.data.error || 'Session validation failed');
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        
        // Handle different types of errors
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            setError('Connection timeout. Please check your internet connection.');
          } else if (error.response?.status === 401) {
            localStorage.removeItem("token");
            setUser(null);
            setError('Session expired. Please login again.');
          } else if (error.response && typeof error.response.status === "number" && error.response.status >= 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(error.response?.data?.error || 'Failed to validate session');
          }
        } else {
          setError('Network error. Please check your connection.');
        }
        
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    const token = localStorage.getItem("token");
    if (token) {
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthenticate = (userData: { name: string; email: string; id?: string; monthlyBudget?: number }) => {
    console.log('User authenticated:', userData);
    
    // Transform the data to include required id field
    const user: User = {
      id: userData.id || 'temp-user-id', // Provide fallback ID
      name: userData.name,
      email: userData.email,
      monthlyBudget: userData.monthlyBudget || 0,
    };
    
    setUser(user);
    setError(null);
  };

  const handleLogout = () => {
    console.log('User logging out');
    localStorage.clear();
    setUser(null);
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (token) {
      // Re-run token validation
      const validateToken = async () => {
        try {
          const response = await axios.post(
            "/api/auth/session",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (response.data.success) {
            const userData = response.data.userData;
            const user: User = {
              id: userData.id || userData._id || 'user-id',
              name: userData.name || 'User',
              email: userData.email || 'user@example.com',
              monthlyBudget: userData.monthlyBudget || 0,
            };
            setUser(user);
            setError(null);
          } else {
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem("token");
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      };
      validateToken();
    } else {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state (only for non-auth errors)
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show auth page if no user
  if (!user) {
    return <AuthenticationPage onAuthenticate={handleAuthenticate} />;
  }

  // Show dashboard if user is authenticated
  return <ExpenseDashboard user={user} onLogout={handleLogout} />;
};

export default AppWrapper;