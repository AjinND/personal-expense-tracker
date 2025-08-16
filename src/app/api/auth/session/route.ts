// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/authService";
import { getClientIdentifier } from "@/lib/rate-limit";
import { AuthError, AuthErrorCodes, AuthUser } from "@/types/auth-backend";

// Helper function to extract token from authorization header
function extractToken(authHeader: string | null): string {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(
      "Invalid authorization header format",
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
  
  return token;
}

// Helper function to create error response
function createErrorResponse(error: AuthError | Error): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: error.statusCode });
  }

  console.error('Session validation error:', error);
  return NextResponse.json({
    success: false,
    error: "Internal server error"
  }, { status: 500 });
}

// Validate session endpoint
export async function POST(req: NextRequest) {
  try {
    // Rate limiting for session validation
    const clientId = getClientIdentifier(req);
    await authService.checkRateLimit(clientId);
    
    // Extract and validate token
    const authHeader = req.headers.get("authorization");
    const token = extractToken(authHeader);
    
    // Validate session
    const result = await authService.validateSession(token);
    
    if (!result.valid) {
      throw new AuthError(
        "Invalid or expired session",
        AuthErrorCodes.INVALID_TOKEN,
        401
      );
    }
    
    // Add security headers
    const response = NextResponse.json({
      success: true,
      userData: result.user,
      message: "Session is valid"
    });
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
    
  } catch (error) {
    return createErrorResponse(error as AuthError | Error);
  }
}

// Get current user info endpoint
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    await authService.checkRateLimit(clientId);
    
    // Extract and validate token
    const authHeader = req.headers.get("authorization");
    const token = extractToken(authHeader);
    
    // Validate session and get user
    const result = await authService.validateSession(token);
    
    if (!result.valid) {
      throw new AuthError(
        "Invalid or expired session",
        AuthErrorCodes.INVALID_TOKEN,
        401
      );
    }
    
    return NextResponse.json({
      success: true,
      user: result.user,
      message: "User data retrieved successfully"
    });
    
  } catch (error) {
    return createErrorResponse(error as AuthError | Error);
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed"
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed"
  }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed"
  }, { status: 405 });
}