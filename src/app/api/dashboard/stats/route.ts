// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dashboardService } from "@/services/dashboardService";
import { withAuth, withSecurityHeaders, withRateLimit } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/rate-limit";
import { 
  DashboardError,
  VALIDATION_CONSTANTS
} from "@/types/dashboard-backend";
import { AuthTokenPayload } from "@/types/auth-backend";

// Validation schema for stats query parameters
const statsQuerySchema = z.object({
  startDate: z.string().regex(VALIDATION_CONSTANTS.DATE_FORMAT).optional(),
  endDate: z.string().regex(VALIDATION_CONSTANTS.DATE_FORMAT).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, "Start date must be before or equal to end date");

// Helper function to create error response
function createErrorResponse(error: DashboardError | z.ZodError | Error): NextResponse {
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

  if (error instanceof DashboardError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: error.statusCode });
  }

  console.error('Unexpected stats error:', error);
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
  response.headers.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
  
  return response;
}

// GET /api/dashboard/stats - Get expense statistics
export const GET = withSecurityHeaders(
  withRateLimit(30)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        const { searchParams } = new URL(req.url);

        // Parse and validate query parameters
        const queryParams = statsQuerySchema.parse({
          startDate: searchParams.get('startDate'),
          endDate: searchParams.get('endDate'),
        });

        const result = await dashboardService.getExpenseStats(
          user.id,
          queryParams.startDate,
          queryParams.endDate,
          clientId
        );

        return createSuccessResponse(result);

      } catch (error) {
        return createErrorResponse(error as DashboardError | z.ZodError | Error);
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