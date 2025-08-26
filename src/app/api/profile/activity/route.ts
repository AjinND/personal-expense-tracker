// src/app/api/profile/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await verifyTokenFromRequest(request);
    const userId = tokenPayload.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await dbConnect();

    // Get activity logs
    const [activities, total] = await Promise.all([
      ActivityLog.find({ userId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ userId: userId })
    ]);

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Activity log fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
