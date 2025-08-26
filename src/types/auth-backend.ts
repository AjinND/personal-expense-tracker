// src/types/auth-backend.ts
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  expenses: string[];
  monthlyBudget: number;
  isActive: boolean;
  emailVerified: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  name: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthRequest {
  action: 'login' | 'register' | 'refresh' | 'logout';
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
  refreshToken?: string;
}

// Specific request types for better validation
export interface LoginRequest {
  action: 'login';
  email: string;
  password: string;
}

export interface RegisterRequest {
  action: 'register';
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshRequest {
  action: 'refresh';
  refreshToken: string;
}

export interface LogoutRequest {
  action: 'logout';
  refreshToken: string;
}

// export interface AuthUser {
//   id: string;
//   name: string;
//   email: string;
//   monthlyBudget: number;
//   emailVerified: boolean;
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface AuthUser {
  id: string;
  avatar?: string;
  name: string;
  email: string;
  monthlyBudget?: number;
  emailVerified?: boolean;
  createdAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
  expiresIn?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (userData: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  refreshSession: () => Promise<void>;
}

export interface SecurityConfig {
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  account: {
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}

export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'AUTH_ERROR',
    statusCode: number = 401,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export enum AuthErrorCodes {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_EXISTS = 'USER_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}