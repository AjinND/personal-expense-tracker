// src/app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "@/services/dashboardService";
import { withAuth, withSecurityHeaders, withRateLimit } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/rate-limit";
import { DashboardError } from "@/types/dashboard";
import { AuthTokenPayload } from "@/types/auth-backend";

// Helper function to create error response
function createErrorResponse(error: DashboardError | Error): NextResponse {
  if (error instanceof DashboardError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: error.statusCode });
  }

  console.error('Unexpected dashboard summary error:', error);
  return NextResponse.json({
    success: false,
    error: "Internal server error"
  }, { status: 500 });
}

// Helper function to create success response
function createSuccessResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cache-Control', 'private, max-age=60'); // Cache for 1 minute
  
  return response;
}

// GET /api/dashboard/summary - Get complete dashboard summary
export const GET = withSecurityHeaders(
  withRateLimit(30)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);

        const result = await dashboardService.getDashboardSummary(
          user.id,
          clientId
        );

        return createSuccessResponse(result);

      } catch (error) {
        return createErrorResponse(error as DashboardError | Error);
      }
    })
  )
);

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed"
  }, { status: 405 });
}

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