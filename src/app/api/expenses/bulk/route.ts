// src/app/api/expenses/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dashboardService } from "@/services/dashboardService";
import { withAuth, withSecurityHeaders, withRateLimit } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/rate-limit";
import { 
  VALIDATION_CONSTANTS,
  CreateExpenseRequest
} from "@/types/dashboard-backend";
import { AuthTokenPayload } from "@/types/auth-backend";
import { DashboardError } from "@/types/dashboard";

// Validation schema for bulk expense import
const bulkExpenseSchema = z.object({
  expenses: z.array(
    z.object({
      date: z.string()
        .regex(VALIDATION_CONSTANTS.DATE_FORMAT, "Date must be in YYYY-MM-DD format")
        .refine((date) => {
          const expenseDate = new Date(date);
          const today = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          return expenseDate <= today && expenseDate >= oneYearAgo;
        }, "Date must be within the last year and not in the future"),
      category: z.enum(['food', 'shopping', 'travelling', 'entertainment'], {
        errorMap: () => ({ message: "Invalid category" })
      }),
      amount: z.number()
        .positive("Amount must be positive")
        .min(VALIDATION_CONSTANTS.MIN_AMOUNT, `Amount must be at least ${VALIDATION_CONSTANTS.MIN_AMOUNT}`)
        .max(VALIDATION_CONSTANTS.MAX_AMOUNT, `Amount cannot exceed ${VALIDATION_CONSTANTS.MAX_AMOUNT}`)
        .refine((val) => Number.isFinite(val), "Amount must be a valid number"),
    })
  )
  .min(1, "At least one expense is required")
  .max(100, "Cannot import more than 100 expenses at once")
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

  console.error('Unexpected bulk import error:', error);
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

// POST /api/expenses/bulk - Bulk import expenses
export const POST = withSecurityHeaders(
  withRateLimit(5)( // Very restrictive rate limit for bulk operations
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        
        // Check content length (max 1MB for bulk operations)
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 1024 * 1024) {
          throw new DashboardError(
            "Request body too large for bulk import",
            "PAYLOAD_TOO_LARGE",
            413
          );
        }
        
        // Parse and validate request body
        const body = await req.json();
        const validatedData = bulkExpenseSchema.parse(body);

        const result = await dashboardService.bulkImportExpenses(
          user.id,
          validatedData.expenses as CreateExpenseRequest[],
          clientId
        );

        return createSuccessResponse(result, 201);

      } catch (error) {
        return createErrorResponse(error as DashboardError | z.ZodError | Error);
      }
    })
  )
);

// Handle unsupported methods
export async function GET() {
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