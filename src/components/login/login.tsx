"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

// Dummy user data (in a real app, this would come from backend)
const DUMMY_USERS = [
  {
    username: "user@example.com",
    password: "password123",
    name: "John Doe",
  },
  {
    username: "admin@example.com",
    password: "admin123",
    name: "Jane Smith",
  },
];

const AuthenticationPage: React.FC<{
  onAuthenticate: (userdate: { name: string; email: string }) => void;
}> = ({ onAuthenticate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Find user in dummy data
    const user = DUMMY_USERS.find(
      (u) => u.username === email && u.password === password
    );

    if (user) {
      setError("");
      onAuthenticate({
        name: user.name,
        email: user.username,
      });
    } else {
      setError("Invalid email or password");
    }
  };

  const handleRegistration = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check if user already exists
    const existingUser = DUMMY_USERS.find((u) => u.username === email);
    if (existingUser) {
      setError("User with this email already exists");
      return;
    }

    // Create new user
    const newUser = {
      id: DUMMY_USERS.length + 1,
      username: email,
      password: password,
      name: name,
    };
    DUMMY_USERS.push(newUser);

    // Automatically log in the new user
    setError("");
    onAuthenticate({
      name: newUser.name,
      email: newUser.username,
    });
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isLogin ? "Login" : "Register"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your email and password to access the application"
              : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={isLogin ? handleLogin : handleRegistration}
            className="grid gap-4"
          >
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button type="submit" className="w-full">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleAuthMode}
              className="underline ml-1 bg-transparent border-none cursor-pointer"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-2 text-center text-sm">
              Forgot password?
              <a href="#" className="underline ml-1">
                Reset here
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthenticationPage;
