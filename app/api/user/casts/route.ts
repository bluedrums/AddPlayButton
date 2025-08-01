import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ success: true, casts: [] });
  } catch (error) {
    console.error("User casts API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
