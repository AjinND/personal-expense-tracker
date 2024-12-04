import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";

export async function GET() {
  try {
    await dbConnect();
    const expenses = await Expense.find({});
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, category, amount } = body;

    if (!date || !category || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, error: "Date, category, and amount are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find existing expense entry for the date
    let expense = await Expense.findOne({ date });

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
      });
    }

    await expense.save();

    return NextResponse.json({ success: true, data: [expense] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
