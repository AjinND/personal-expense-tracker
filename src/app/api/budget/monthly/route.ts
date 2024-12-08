import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import dbConnect from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const user = verifyToken(authHeader) as JwtPayload;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }
    await dbConnect();
    const userId = new mongoose.Types.ObjectId(user.id);

    const body = await req.json();
    const { parsedBudget } = body;

    console.log("budget --> ", parsedBudget);

    if (!parsedBudget || typeof parsedBudget !== "number" || parsedBudget <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid budget amount" },
        { status: 400 }
      );
    }

    // Update the user's monthly budget in the database
    const updatedUser = await User.findByIdAndUpdate(
        userId, 
      { $set: { monthlyBudget: parsedBudget } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Monthly budget set successfully",
      budget: updatedUser?.monthlyBudget,
    });
  } catch (error) {
    console.error("Error setting budget:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: "Authorization header missing" },
          { status: 401 }
        );
      }
  
      const user = verifyToken(authHeader) as JwtPayload;
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid token" },
          { status: 401 }
        );
      }
      await dbConnect();
      const userId = new mongoose.Types.ObjectId(user.id);
      const userData = await User.findOne({ _id: userId });
      return NextResponse.json({ success: true, monthlyBudget: userData.monthlyBudget });

    } catch (error) {
        console.error("Error setting budget:", error);
        return NextResponse.json(
          { success: false, error: "Internal Server Error" },
          { status: 500 }
        );
      }
}
