// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/authService";
import { getClientIdentifier } from "@/lib/rate-limit";
import { 
  AuthError, 
  AuthErrorCodes, 
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  LogoutRequest
} from "@/types/auth-backend";

// Enhanced validation schemas
const baseAuthSchema = {
  email: z.string()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Invalid email format")
    .transform(email => email.toLowerCase().trim()),
    
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
    
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long")
    .regex(
      /^[a-zA-Z\s]+$/,
      "Name can only contain letters and spaces"
    )
    .transform(name => name.trim())
    .optional(),
};

const loginSchema = z.object({
  action: z.literal("login"),
  email: baseAuthSchema.email,
  password: baseAuthSchema.password,
});

const registerSchema = z.object({
  action: z.literal("register"),
  name: baseAuthSchema.name.refine(val => val !== undefined, {
    message: "Name is required for registration"
  }),
  email: baseAuthSchema.email,
  password: baseAuthSchema.password,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const refreshSchema = z.object({
  action: z.literal("refresh"),
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const logoutSchema = z.object({
  action: z.literal("logout"),
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Helper function to validate request body
function validateAuthRequest(body: any): LoginRequest | RegisterRequest | RefreshRequest | LogoutRequest {
  const action = body.action;
  
  switch (action) {
    case "login":
      return loginSchema.parse(body);
    case "register":
      return registerSchema.parse(body);
    case "refresh":
      return refreshSchema.parse(body);
    case "logout":
      return logoutSchema.parse(body);
    default:
      throw new z.ZodError([{
        code: 'custom',
        message: "Invalid action. Must be 'login', 'register', 'refresh', or 'logout'",
        path: ['action']
      }]);
  }
}

// Helper function to create error response
function createErrorResponse(error: AuthError | z.ZodError | Error): NextResponse {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: "Validation failed",
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    }, { status: 400 });
  }

  // Handle custom auth errors
  if (error instanceof AuthError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: error.statusCode });
  }

  // Handle unexpected errors
  console.error('Unexpected auth error:', error);
  return NextResponse.json({
    success: false,
    error: "Internal server error"
  }, { status: 500 });
}

// Helper function to create success response with secure headers
function createSuccessResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add refresh token as httpOnly cookie if present
  if (data.refreshToken) {
    response.cookies.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    // Don't expose refresh token in response body
    delete data.refreshToken;
  }
  
  return response;
}

export async function POST(req: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientId = getClientIdentifier(req);
    
    // Parse request body with size limit
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 10) { // 10KB limit
      return NextResponse.json({
        success: false,
        error: "Request body too large"
      }, { status: 413 });
    }

    const body = await req.json();
    
    // Validate request body
    const validatedData = validateAuthRequest(body);
    
    // Handle different auth actions
    switch (validatedData.action) {
      case "register": {
        const result = await authService.register(validatedData, clientId);
        return createSuccessResponse(result, 201);
      }
      
      case "login": {
        const result = await authService.login(validatedData, clientId);
        return createSuccessResponse(result);
      }
      
      case "refresh": {
        const result = await authService.refreshAccessToken(
          validatedData.refreshToken,
          clientId
        );
        return createSuccessResponse(result);
      }
      
      case "logout": {
        // Get user ID from authorization header for logout
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          throw new AuthError(
            "Authorization header required for logout",
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
        
        const decoded = await authService.verifyAccessToken(token);
        
        const result = await authService.logout(
          validatedData.refreshToken,
          decoded.id
        );
        
        // Clear refresh token cookie
        const response = createSuccessResponse(result);
        response.cookies.delete('refreshToken');
        return response;
      }
      
      default:
        throw new AuthError(
          "Invalid action",
          AuthErrorCodes.VALIDATION_ERROR,
          400
        );
    }

  } catch (error) {
    return createErrorResponse(error as AuthError | z.ZodError | Error);
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: "Auth service is healthy",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Service unavailable"
    }, { status: 503 });
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