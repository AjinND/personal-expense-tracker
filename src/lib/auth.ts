// src/lib/auth.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  name: string;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export function verifyToken(authHeader: string | null): TokenPayload {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Authorization header missing or invalid format", 401);
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    throw new AuthError("Token missing from authorization header", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'expense-tracker',
      audience: 'expense-tracker-client'
    }) as TokenPayload;

    // Ensure required fields are present
    if (!decoded.id || !decoded.email) {
      throw new AuthError("Invalid token payload", 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Token has expired", 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError("Invalid token", 401);
    }
    throw new AuthError("Token verification failed", 401);
  }
}

export function verifyTokenFromRequest(req: NextRequest): TokenPayload {
  const authHeader = req.headers.get("authorization");
  return verifyToken(authHeader);
}

export function verifyTokenFromCookie(req: NextRequest): TokenPayload {
  const token = req.cookies.get("token")?.value;
  
  if (!token) {
    throw new AuthError("Authentication token not found", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'expense-tracker',
      audience: 'expense-tracker-client'
    }) as TokenPayload;

    if (!decoded.id || !decoded.email) {
      throw new AuthError("Invalid token payload", 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Session has expired", 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError("Invalid session", 401);
    }
    throw new AuthError("Session verification failed", 401);
  }
}

export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: 'expense-tracker',
      audience: 'expense-tracker-client'
    }
  );
}

// Middleware helper for API routes
export function withAuth(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const user = verifyTokenFromRequest(req);
      // Add user to request object
      (req as any).user = user;
      return handler(req, ...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      throw error;
    }
  };
}