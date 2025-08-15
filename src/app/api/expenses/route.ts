import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { verifyToken, AuthError } from "@/lib/auth";
import mongoose from "mongoose";
import { z } from "zod";
import rateLimit from "@/lib/rate-limit";

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Validation schemas
const expenseCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  category: z.enum(["food", "shopping", "travelling", "entertainment"], {
    errorMap: () => ({ message: "Invalid category" })
  }),
  amount: z.number()
    .positive("Amount must be positive")
    .max(10000, "Amount cannot exceed $10,000")
    .refine((val) => Number.isFinite(val) && val > 0, "Invalid amount"),
});

// Date validation helper
const validateExpenseDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return date <= today && date >= oneYearAgo;
};

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientId = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(60, clientId); // 60 requests per minute for GET

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const user = verifyToken(authHeader);

    await dbConnect();

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Fetch user's expenses with proper sorting
    const expenses = await Expense.find({ 
      user: new mongoose.Types.ObjectId(user.id) 
    })
    .sort({ date: 1 }) // Sort by date ascending
    .lean() // Use lean() for better performance
    .exec();

    return NextResponse.json({ 
      success: true, 
      data: expenses,
      count: expenses.length
    });

  } catch (error: any) {
    console.error("Expense GET error:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting for POST (more restrictive)
    const clientId = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(30, clientId); // 30 requests per minute for POST

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const user = verifyToken(authHeader);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = expenseCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed",
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { date, category, amount } = validationResult.data;

    // Additional date validation
    if (!validateExpenseDate(date)) {
      return NextResponse.json(
        { success: false, error: "Date must be within the last year and not in the future" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(user.id);

    // Start a transaction for data consistency
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find or create expense entry for the date
        let expense = await Expense.findOne({ user: userId, date }).session(session);

        if (expense) {
          // Update existing expense
          const currentAmount = expense[category] || 0;
          const newAmount = currentAmount + amount;
          
          // Validate total doesn't exceed reasonable limits
          if (newAmount > 10000) {
            throw new Error(`Total ${category} expense for this date would exceed $10,000`);
          }
          
          expense[category] = newAmount;
          await expense.save({ session });
        } else {
          // Create new expense entry
          expense = new Expense({
            date,
            food: 0,
            shopping: 0,
            travelling: 0,
            entertainment: 0,
            [category]: amount,
            user: userId,
          });
          
          await expense.save({ session });
          
          // Add expense reference to user (if not already present)
          await User.findByIdAndUpdate(
            userId,
            { $addToSet: { expenses: expense._id } }, // Use $addToSet to avoid duplicates
            { session }
          );
        }
      });

      // Fetch the updated expense
      const updatedExpense = await Expense.findOne({ user: userId, date }).lean();

      return NextResponse.json({ 
        success: true, 
        data: [updatedExpense],
        message: `$${amount.toFixed(2)} added to ${category}`
      }, { status: 201 });

    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error("Expense POST error:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: "Invalid expense data" },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Expense entry already exists for this date" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to add expense" },
      { status: 500 }
    );
  }
}

// Optional: Add PUT method for updating expenses
export async function PUT(req: Request) {
  try {
    const clientId = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(20, clientId);

    const authHeader = req.headers.get("authorization");
    const user = verifyToken(authHeader);

    const body = await req.json();
    const { expenseId, updates } = body;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json(
        { success: false, error: "Invalid expense ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const expense = await Expense.findOne({
      _id: expenseId,
      user: new mongoose.Types.ObjectId(user.id)
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    // Update only allowed fields
    const allowedUpdates = ['food', 'shopping', 'travelling', 'entertainment'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key) && typeof updates[key] === 'number' && updates[key] >= 0) {
        expense[key] = updates[key];
      }
    });

    await expense.save();

    return NextResponse.json({
      success: true,
      data: expense,
      message: "Expense updated successfully"
    });

  } catch (error: any) {
    console.error("Expense PUT error:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE method for removing expenses
export async function DELETE(req: Request) {
  try {
    const clientId = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(10, clientId);

    const authHeader = req.headers.get("authorization");
    const user = verifyToken(authHeader);

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');

    if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json(
        { success: false, error: "Invalid expense ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const expense = await Expense.findOneAndDelete({
      _id: expenseId,
      user: new mongoose.Types.ObjectId(user.id)
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    // Remove expense reference from user
    await User.findByIdAndUpdate(
      user.id,
      { $pull: { expenses: expenseId } }
    );

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully"
    });

  } catch (error: any) {
    console.error("Expense DELETE error:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}