import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ success: false, error: "FID is required" }, { status: 400 })
    }

    const casts = await client.fetchCastsForUser(fid, { viewerFid: fid, limit: 100 });
    return NextResponse.json({ success: true, casts: casts.casts.map(c => ({ text: c.text })) });

  } catch (error) {
    console.error("User casts API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
