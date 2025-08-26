// src/app/api/budget/monthly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dashboardService } from "@/services/dashboardService";
import { withAuth, withSecurityHeaders, withRateLimit } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/rate-limit";
import { 
  VALIDATION_CONSTANTS,
  BudgetRequest
} from "@/types/dashboard-backend";
import { AuthTokenPayload } from "@/types/auth-backend";
import { DashboardError } from "@/types/dashboard";

// Validation schema for budget updates
const budgetSchema = z.object({
  parsedBudget: z.number()
    .min(VALIDATION_CONSTANTS.MIN_BUDGET, "Budget cannot be negative")
    .max(VALIDATION_CONSTANTS.MAX_BUDGET, `Budget cannot exceed ${VALIDATION_CONSTANTS.MAX_BUDGET}`)
    .refine((val) => Number.isFinite(val), "Budget must be a valid number"),
});

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

  console.error('Unexpected budget error:', error);
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
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  return response;
}

// POST /api/budget/monthly - Update monthly budget
export const POST = withSecurityHeaders(
  withRateLimit(10)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        
        // Parse and validate request body
        const body = await req.json();
        const validatedData = budgetSchema.parse(body);

        const result = await dashboardService.updateMonthlyBudget(
          user.id,
          validatedData as BudgetRequest,
          clientId
        );

        return createSuccessResponse(result);

      } catch (error) {
        return createErrorResponse(error as DashboardError | z.ZodError | Error);
      }
    })
  )
);

// GET /api/budget/monthly - Get monthly budget
export const GET = withSecurityHeaders(
  withRateLimit(60)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);

        const result = await dashboardService.getMonthlyBudget(
          user.id,
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