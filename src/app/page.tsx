"use client";

import ExpenseDashboard from "@/components/dashboard/expenseDashboard";
import AuthenticationPage from "@/components/login/login";
import { verifyToken } from "@/lib/auth";
import axios from "axios";
import React, { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
};
const AppWrapper = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(async () => {
    const token = localStorage.getItem("token");
    console.log("UserData ---> ", token);
    if(token) {
      const response = await axios.get("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    //  axios
    //     .post("/api/auth/session", {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     }) 
    //     .then((response) => {
    //       if (response.data.success) {
    //         setUser(response.data.user);  // Set user if token is valid
    //       }
    //     })
    //     .catch((error) => {
    //       console.error("Error verifying token:", error);
    //       localStorage.removeItem("token");  // Remove invalid token from localStorage
    //       setUser(null);
    //     });
    }
  },[])

  const handleAuthenticate = (userData: React.SetStateAction<User | null>) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // If no user is authenticated, show login page
  console.log("UserData ---> ", user)
  if (!user) {
    return <AuthenticationPage onAuthenticate={handleAuthenticate} />;
  }

  // If user is authenticated, show dashboard (or main app)
  return <ExpenseDashboard user={user} onLogout={handleLogout} />;
};

export default AppWrapper;
