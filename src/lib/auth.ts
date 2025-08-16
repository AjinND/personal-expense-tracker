// src/lib/auth.ts
import { NextRequest } from "next/server";
import { authService } from "@/services/authService";
import { AuthError, AuthErrorCodes, AuthTokenPayload, AuthUser } from "@/types/auth-backend";

/**
 * Secure authentication utilities with improved error handling and validation
 */

/**
 * Extract and verify token from authorization header
 */
export async function verifyToken(authHeader: string | null): Promise<AuthTokenPayload> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(
      "Authorization header missing or invalid format",
      AuthErrorCodes.INVALID_TOKEN,
      401
    );
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    throw new AuthError(
      "Token missing from authorization header",
      AuthErrorCodes.INVALID_TOKEN,
      401
    );
  }

  try {
    return await authService.verifyAccessToken(token);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      "Token verification failed",
      AuthErrorCodes.INVALID_TOKEN,
      401
    );
  }
}

/**
 * Extract and verify token from Next.js request
 */
export async function verifyTokenFromRequest(req: NextRequest): Promise<AuthTokenPayload> {
  const authHeader = req.headers.get("authorization");
  return verifyToken(authHeader);
}

/**
 * Extract and verify refresh token from cookies
 */
export async function verifyTokenFromCookie(req: NextRequest): Promise<AuthTokenPayload> {
  const refreshToken = req.cookies.get("refreshToken")?.value;
  
  if (!refreshToken) {
    throw new AuthError(
      "Refresh token not found in cookies",
      AuthErrorCodes.INVALID_TOKEN,
      401
    );
  }

  try {
    return await authService.verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      "Refresh token verification failed",
      AuthErrorCodes.INVALID_TOKEN,
      401
    );
  }
}

/**
 * Middleware wrapper for protecting API routes
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, user: AuthTokenPayload, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await verifyTokenFromRequest(req);
      
      // Add user to request context
      (req as any).user = user;
      
      return await handler(req, user, ...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            code: error.code
          }),
          {
            status: error.statusCode,
            headers: { 
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff'
            }
          }
        );
      }
      
      console.error('Auth middleware error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal server error"
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }
  };
}

/**
 * Check if user has required permissions (extensible for future use)
 */
export function requirePermissions(permissions: string[] = []) {
  return function <T extends any[]>(
    handler: (req: NextRequest, user: AuthTokenPayload, ...args: T) => Promise<Response>
  ) {
    return withAuth(async (req: NextRequest, user: AuthTokenPayload, ...args: T) => {
      // Future: Check user permissions against required permissions
      // For now, just ensure user is authenticated
      
      if (!user.id || !user.email) {
        throw new AuthError(
          "Invalid user session",
          AuthErrorCodes.INVALID_TOKEN,
          401
        );
      }
      
      return await handler(req, user, ...args);
    });
  };
}

/**
 * Optional auth wrapper - doesn't fail if no auth provided
 */
export function withOptionalAuth<T extends any[]>(
  handler: (req: NextRequest, user: AuthTokenPayload | null, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await verifyTokenFromRequest(req);
      return await handler(req, user, ...args);
    } catch (error) {
      // If auth fails, continue without user
      return await handler(req, null, ...args);
    }
  };
}

/**
 * Rate limiting wrapper for auth endpoints
 */
export function withRateLimit(
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<Response>
  ) {
    return async (req: NextRequest, ...args: T): Promise<Response> => {
      try {
        const clientId = req.headers.get('x-forwarded-for') || 
                        req.headers.get('x-real-ip') || 
                        'unknown';
        
        await authService.checkRateLimit(clientId);
        return await handler(req, ...args);
      } catch (error) {
        if (error instanceof AuthError && error.code === AuthErrorCodes.RATE_LIMIT_EXCEEDED) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message,
              code: error.code
            }),
            {
              status: 429,
              headers: { 
                'Content-Type': 'application/json',
                'Retry-After': '900' // 15 minutes
              }
            }
          );
        }
        throw error;
      }
    };
  };
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const response = await handler(req, ...args);
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), location=()');
    
    // Add HSTS header in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    return response;
  };
}

/**
 * Input sanitization helper
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8 || password.length > 128) {
    return false;
  }
  
  // Must contain at least one uppercase, lowercase, and number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber;
}

// Export the AuthError and codes for use in other modules
export { AuthError, AuthErrorCodes };