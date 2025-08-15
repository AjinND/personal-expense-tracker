import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/models/User";
import { z } from "zod";
import rateLimit from "@/lib/rate-limit";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Validation schemas
const loginSchema = z.object({
  action: z.literal("login"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  action: z.literal("register"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Sanitize user data for response
const sanitizeUser = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  monthlyBudget: user.monthlyBudget,
});

// Generate JWT token
const generateToken = (user: IUser) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      name: user.name 
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'expense-tracker',
      audience: 'expense-tracker-client'
    }
  );
};

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(5, clientId); // 5 requests per minute

    // Parse and validate request body
    const body = await req.json();
    
    // Connect to database
    await dbConnect();

    if (body.action === "register") {
      // Validate registration data
      const validationResult = registerSchema.safeParse(body);
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

      const { name, email, password } = validationResult.data;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        email: email.toLowerCase() 
      }).select('email');
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      // Hash password with higher cost factor
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        monthlyBudget: 0,
        expenses: []
      });

      // Generate token
      const token = generateToken(newUser);

      return NextResponse.json({ 
        success: true, 
        token, 
        user: sanitizeUser(newUser),
        message: "Account created successfully"
      }, { 
        status: 201,
        headers: {
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
        }
      });

    } else if (body.action === "login") {
      // Validate login data
      const validationResult = loginSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid login credentials",
            details: validationResult.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          },
          { status: 400 }
        );
      }

      const { email, password } = validationResult.data;

      // Find user with password field
      const user = await User.findOne({ 
        email: email.toLowerCase() 
      }).select('+password');
      
      if (!user) {
        // Use same error message to prevent email enumeration
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Generate token
      const token = generateToken(user);

      return NextResponse.json({ 
        success: true, 
        token, 
        user: sanitizeUser(user),
        message: "Login successful"
      }, {
        headers: {
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
        }
      });

    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'login' or 'register'" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Auth error:", error);

    // Handle rate limiting
    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error. Please try again later." 
      },
      { status: 500 }
    );
  }
}