import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  const { action, name, email, password, confirmPassword } = await req.json();

  await dbConnect();

  if (action === "register") {
    // Handle registration
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 }
      );
    }

    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "User with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser: IUser = await User.create({
        name,
        email,
        password: hashedPassword,
      });

      return NextResponse.json({ success: true, user: newUser });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  } else if (action === "login") {
    // Handle login
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Generate JWT
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return NextResponse.json({ success: true, token, user });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  }
}
