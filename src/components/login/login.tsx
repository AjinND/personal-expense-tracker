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

const AuthenticationPage: React.FC<{
  onAuthenticate: (userdata: { name: string; email: string }) => void;
}> = ({ onAuthenticate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    handleUserAuthentication(e);
  };

  const handleRegistration = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    handleUserAuthentication(e);
  };

  const handleUserAuthentication = async (e: {
    preventDefault: () => void;
  }) => {
    e.preventDefault();

    const action = isLogin ? "login" : "register";
    const body = {
      action,
      name,
      email,
      password,
      ...(isLogin ? {} : { confirmPassword }),
    };

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        setIsSubmitting(false);
        setError(data.error);
        return;
      }

      // Save token in localStorage
      localStorage.setItem("token", data.token);

      setError("");
      onAuthenticate({ name: data.user.name, email: data.user.email });
    } catch (error: any) {
      setIsSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
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
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? isLogin
                  ? "Signing In..."
                  : "Creating Account..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>
          </form>

          {!isSubmitting && (
            <div className="mt-4 text-center text-sm">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={toggleAuthMode}
                className="underline ml-1 bg-transparent border-none cursor-pointer"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </div>
          )}

          {isLogin && !isSubmitting && (
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
