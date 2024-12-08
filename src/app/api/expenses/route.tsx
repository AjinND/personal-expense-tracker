import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { use } from "react";
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export async function GET(req: Request) {
  // console.log("token", req.headers.get("authorization"));
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  try {
    const user = verifyToken(authHeader) as JwtPayload;
    await dbConnect();

    // Validate userId
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    const expenses = await Expense.find({ user: user.id });
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  try {
    const body = await req.json();
    // console.log("auth ---> ", body);
    const { date, category, amount } = body;

    if (!date || !category || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    const user = verifyToken(authHeader) as JwtPayload;
    // Validate userId
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }
    // console.log("user ---> ", user);
    await dbConnect();
    const userId = new mongoose.Types.ObjectId(user.id)

    // Find existing expense entry for the date
    let expense = await Expense.findOne({ user: userId, date });

    if (expense) {
      // Update the category amount
      expense[category] += amount;
    } else {
      // Create a new expense entry
      expense = new Expense({
        date,
        food: 0,
        shopping: 0,
        travelling: 0,
        entertainment: 0,
        [category]: amount,
        user: user.id,
      });
    }

    const response = await expense.save();
    if (response) {
      await User.findByIdAndUpdate(
        userId,
        { $push: { expenses: response._id } }, // Push the new expense ID
        { new: true}
      );
    }

    return NextResponse.json({ success: true, data: [expense] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
