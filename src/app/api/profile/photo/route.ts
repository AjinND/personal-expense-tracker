// src/app/api/profile/photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifyTokenFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/SecureUser";
import { ActivityLog } from "@/models/ActivityLog";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

// Generate unique filename
function generateFileName(originalName: string, userId: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `avatar_${userId}_${timestamp}${ext}`;
}

// Validate image file
function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Only JPG, PNG, and GIF are allowed.';
  }
  
  if (file.size > MAX_SIZE) {
    return 'File size must be less than 2MB.';
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await verifyTokenFromRequest(request);
    const userId = tokenPayload.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate filename and save file
    const fileName = generateFileName(file.name, userId);
    const filePath = path.join(UPLOAD_DIR, fileName);
    const fileUrl = `/uploads/avatars/${fileName}`;

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('File save error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to save file" },
        { status: 500 }
      );
    }

    // Update user avatar in database
    user.avatar = fileUrl;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: userId,
      action: 'profile_photo_updated',
      details: { 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: "Profile photo updated successfully",
      photoUrl: fileUrl,
      user: user.sanitizeForResponse()
    });

  } catch (error) {
    console.error("Profile photo upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await verifyTokenFromRequest(request);
    const userId = tokenPayload.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Remove avatar from user
    const oldAvatarUrl = user.avatar;
    user.avatar = undefined;
    await user.save();

    // TODO: Optionally delete the old file from filesystem
    // if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/')) {
    //   const oldFilePath = path.join(process.cwd(), 'public', oldAvatarUrl);
    //   await unlink(oldFilePath).catch(err => console.log('Failed to delete old avatar:', err));
    // }

    // Log activity
    await ActivityLog.create({
      userId: userId,
      action: 'profile_photo_removed',
      details: { previousUrl: oldAvatarUrl },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: "Profile photo removed successfully",
      user: user.sanitizeForResponse()
    });

  } catch (error) {
    console.error("Profile photo removal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove profile photo" },
      { status: 500 }
    );
  }
}