import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization");
    console.log(authHeader)

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

    try {
      const userData = verifyToken(authHeader);
      return NextResponse.json({ success: true, userData })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
}
