// src/app/api/profile/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyTokenFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/SecureUser";
import { ActivityLog } from "@/models/ActivityLog";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.literal("DELETE").refine(val => val === "DELETE", {
    message: "Please type DELETE to confirm"
  })
});

export async function DELETE(request: NextRequest) {
  try {
    const tokenPayload = await verifyTokenFromRequest(request);
    const userId = tokenPayload.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    await dbConnect();

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      await ActivityLog.create({
        userId: userId,
        action: 'account_deletion_failed',
        details: { reason: 'Invalid password' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 400 }
      );
    }

    // Soft delete user (mark as inactive)
    user.isActive = false;
    user.email = `deleted_${user._id}_${user.email}`; // Prevent email reuse
    await user.save();

    // Log account deletion
    await ActivityLog.create({
      userId: userId,
      action: 'account_deleted',
      details: { 
        email: user.email,
        deletedAt: new Date()
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    // TODO: Queue job to delete user data after grace period (30 days)

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Account deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}