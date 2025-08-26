// src/app/api/profile/verify-email/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/SecureUser";
import { EmailVerification } from "@/models/EmailVerification";
import { ActivityLog } from "@/models/ActivityLog";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Hash the token to match stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find verification record
    const verification = await EmailVerification.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      verification.userId,
      { emailVerified: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete verification record
    await EmailVerification.deleteOne({ _id: verification._id });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'email_verified',
      details: { email: user.email },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user: user.sanitizeForResponse()
    });

  } catch (error) {
    console.error("Email verification confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}