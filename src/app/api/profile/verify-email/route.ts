// src/app/api/profile/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import User from "@/models/SecureUser";
import { EmailVerification } from "@/models/EmailVerification";
import { ActivityLog } from "@/models/ActivityLog";
import dbConnect from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = await verifyTokenFromRequest(request);
    if (!tokenPayload?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = tokenPayload.id;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email already verified" },
        { status: 400 }
      );
    }

    // Check for existing verification token
    const existingVerification = await EmailVerification.findOne({
      userId: userId,
      expiresAt: { $gt: new Date() }
    });

    if (existingVerification) {
      // Check if we need to rate limit
      const timeSinceLastRequest = Date.now() - existingVerification.createdAt.getTime();
      if (timeSinceLastRequest < 60000) { // 1 minute
        return NextResponse.json(
          { success: false, error: "Please wait before requesting another verification email" },
          { status: 429 }
        );
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Save verification token (expires in 24 hours)
    await EmailVerification.create({
      userId: userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: `
        <h2>Email Verification</h2>
        <p>Hello ${user.name},</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
      `
    });

    // Log activity
    await ActivityLog.create({
      userId: userId,
      action: 'email_verification_requested',
      details: { email: user.email },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}