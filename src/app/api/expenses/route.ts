// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dashboardService } from "@/services/dashboardService";
import { withAuth, withSecurityHeaders, withRateLimit } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/rate-limit";
import { 
  DashboardError, 
  DashboardErrorCodes,
  VALIDATION_CONSTANTS,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseQueryParams
} from "@/types/dashboard-backend";
import { AuthTokenPayload } from "@/types/auth-backend";

// Validation schemas
const createExpenseSchema = z.object({
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
});

const updateExpenseSchema = z.object({
  expenseId: z.string().min(1, "Expense ID is required"),
  updates: z.object({
    food: z.number().min(0).max(VALIDATION_CONSTANTS.MAX_AMOUNT).optional(),
    shopping: z.number().min(0).max(VALIDATION_CONSTANTS.MAX_AMOUNT).optional(),
    travelling: z.number().min(0).max(VALIDATION_CONSTANTS.MAX_AMOUNT).optional(),
    entertainment: z.number().min(0).max(VALIDATION_CONSTANTS.MAX_AMOUNT).optional(),
  }).refine((updates) => {
    return Object.values(updates).some(val => val !== undefined);
  }, "At least one field must be updated"),
});

const queryParamsSchema = z.object({
  startDate: z.string().regex(VALIDATION_CONSTANTS.DATE_FORMAT).optional(),
  endDate: z.string().regex(VALIDATION_CONSTANTS.DATE_FORMAT).optional(),
  category: z.enum(['food', 'shopping', 'travelling', 'entertainment']).optional(),
  limit: z.coerce.number().min(1).max(VALIDATION_CONSTANTS.MAX_LIMIT).optional(),
  offset: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['date', 'total', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
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

  console.error('Unexpected expenses error:', error);
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

// GET /api/expenses - Get user expenses
export const GET = withSecurityHeaders(
  withRateLimit(60)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        const { searchParams } = new URL(req.url);

        // Parse and validate query parameters
        const queryParams = queryParamsSchema.parse({
          startDate: searchParams.get('startDate'),
          endDate: searchParams.get('endDate'),
          category: searchParams.get('category'),
          limit: searchParams.get('limit'),
          offset: searchParams.get('offset'),
          sortBy: searchParams.get('sortBy'),
          sortOrder: searchParams.get('sortOrder'),
        });

        const result = await dashboardService.getExpenses(
          user.id,
          queryParams as ExpenseQueryParams,
          clientId
        );

        return createSuccessResponse(result);

      } catch (error) {
        return createErrorResponse(error as DashboardError | z.ZodError | Error);
      }
    })
  )
);

// POST /api/expenses - Add new expense
export const POST = withSecurityHeaders(
  withRateLimit(30)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        
        // Parse and validate request body
        const body = await req.json();
        const validatedData = createExpenseSchema.parse(body);

        const result = await dashboardService.addExpense(
          user.id,
          validatedData as CreateExpenseRequest,
          clientId
        );

        return createSuccessResponse(result, 201);

      } catch (error) {
        return createErrorResponse(error as DashboardError | z.ZodError | Error);
      }
    })
  )
);

// PUT /api/expenses - Update existing expense
export const PUT = withSecurityHeaders(
  withRateLimit(20)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        
        // Parse and validate request body
        const body = await req.json();
        const validatedData = updateExpenseSchema.parse(body);

        const result = await dashboardService.updateExpense(
          user.id,
          validatedData as UpdateExpenseRequest,
          clientId
        );

        return createSuccessResponse(result);

      } catch (error) {
        return createErrorResponse(error as DashboardError | z.ZodError | Error);
      }
    })
  )
);

// DELETE /api/expenses - Delete expense
export const DELETE = withSecurityHeaders(
  withRateLimit(10)(
    withAuth(async (req: NextRequest, user: AuthTokenPayload) => {
      try {
        const clientId = getClientIdentifier(req);
        const { searchParams } = new URL(req.url);
        
        const expenseId = searchParams.get('id');
        if (!expenseId) {
          throw new DashboardError(
            "Expense ID is required",
            DashboardErrorCodes.VALIDATION_ERROR,
            400
          );
        }

        const result = await dashboardService.deleteExpense(
          user.id,
          expenseId,
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
export async function PATCH() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed"
  }, { status: 405 });
}