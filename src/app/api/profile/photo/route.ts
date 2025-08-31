
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/SecureUser";
import { ActivityLog } from "@/models/ActivityLog";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // Increased to 5MB for better quality

// Add CORS headers helper
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Only ${ALLOWED_TYPES.join(', ')} are allowed.`;
  }
  
  if (file.size > MAX_SIZE) {
    return `File size must be less than ${Math.round(MAX_SIZE / (1024 * 1024))}MB`;
  }
  
  return null;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return setCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Profile photo upload started');
    
    // Verify authentication
    const tokenPayload = await verifyTokenFromRequest(request);
    const userId = tokenPayload.id;
    
    if (!userId) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
      return setCorsHeaders(response);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      const response = NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    console.log('📁 File received:', { name: file.name, type: file.type, size: file.size });

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      const response = NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return setCorsHeaders(response);
    }

    try {
      // Convert file to buffer for Cloudinary
      console.log('🔄 Converting file to buffer...');
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.type.split('/')[1];
      const fileName = `avatar_${userId}_${timestamp}`;
      
      console.log('☁️ Uploading to Cloudinary...');
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(buffer, fileName, file.type);
      
      console.log('✅ Cloudinary upload successful:', cloudinaryUrl);

      // Delete old avatar from Cloudinary if exists
      if (user.avatar && user.avatar.includes('cloudinary.com')) {
        console.log('🗑️ Deleting old avatar from Cloudinary...');
        await deleteFromCloudinary(user.avatar);
      }

      // Update user avatar in database
      user.avatar = cloudinaryUrl;
      await user.save();

      console.log('💾 Database updated successfully');

      // Log activity
      await ActivityLog.create({
        userId: userId,
        action: 'profile_photo_updated',
        details: { 
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storage: 'cloudinary',
          url: cloudinaryUrl
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      const response = NextResponse.json({
        success: true,
        message: "Profile photo updated successfully",
        photoUrl: cloudinaryUrl,
        user: user.sanitizeForResponse()
      });

      return setCorsHeaders(response);

    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError);
      const response = NextResponse.json(
        { 
          success: false, 
          error: "Failed to upload image to cloud storage",
          details: process.env.NODE_ENV === 'development' ? (uploadError instanceof Error ? uploadError.message : typeof uploadError === 'string' ? uploadError : JSON.stringify(uploadError)) : undefined
        },
        { status: 500 }
      );
      return setCorsHeaders(response);
    }

  } catch (error) {
    console.error("❌ Profile photo upload error:", error);
    const response = NextResponse.json(
      { 
        success: false, 
        error: "Failed to update profile photo",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error)) : undefined
      },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await verifyTokenFromRequest(request);
    const userId = tokenPayload.id;
    
    if (!userId) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
      return setCorsHeaders(response);
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return setCorsHeaders(response);
    }

    const oldAvatarUrl = user.avatar;
    
    // Delete from Cloudinary if it's a Cloudinary URL
    if (oldAvatarUrl && oldAvatarUrl.includes('cloudinary.com')) {
      await deleteFromCloudinary(oldAvatarUrl);
    }
    
    // Remove avatar from user
    user.avatar = undefined;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: userId,
      action: 'profile_photo_removed',
      details: { previousUrl: oldAvatarUrl || 'none' },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    const response = NextResponse.json({
      success: true,
      message: "Profile photo removed successfully",
      user: user.sanitizeForResponse()
    });

    return setCorsHeaders(response);

  } catch (error) {
    console.error("Profile photo removal error:", error);
    const response = NextResponse.json(
      { success: false, error: "Failed to remove profile photo" },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}