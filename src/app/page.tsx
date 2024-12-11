"use client";

import ExpenseDashboard from "@/components/dashboard/expenseDashboard";
import AuthenticationPage from "@/components/login/login";
import axios from "axios";
import React, { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
};
const AppWrapper = () => {
  const [user, setUser] = useState<User | null>(null);
  // const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function validateToken(token: string) {
      // setIsLoading(true);
      await axios
        .post(
          "/api/auth/session",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          if (response.data.success) {
            // console.log(response.data.userData);
            setUser(response.data.userData);
            // setIsLoading(false);
          }
        })
        .catch((error) => {
          // console.error("Error verifying token:", error);
          localStorage.removeItem("token");
          setUser(null);
          // setIsLoading(false);
          throw new Error("Error verifying token:", error);
        });
    }
    const token = localStorage.getItem("token");
    if (token) validateToken(token);
  }, []);

  const handleAuthenticate = (userData: React.SetStateAction<User | null>) => {
    // setIsLoading(true);
    if (userData) {
      setUser(userData);
      // setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // const LoadingOverlay = () => (
  //   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  //     <div className="flex flex-col items-center justify-center">
  //       <Loader2 className="h-12 w-12 animate-spin text-white" />
  //       <p className="mt-4 text-white text-lg">Loading...</p>
  //     </div>
  //   </div>
  // );

  // if (isLoading) {
  //   return <LoadingOverlay />;
  // }

  if (!user) {
    return <AuthenticationPage onAuthenticate={handleAuthenticate} />;
  }

  return <ExpenseDashboard user={user} onLogout={handleLogout} />;
};

export default AppWrapper;
