import { type NextRequest, NextResponse } from "next/server"
import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY! });
const client = new NeynarAPIClient(config);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ success: false, error: "FID is required" }, { status: 400 })
    }

    const castsResponse = await client.fetchCastsForUser({ fid: Number(fid), viewerFid: Number(fid), limit: 100 });
    return NextResponse.json({ success: true, casts: castsResponse.casts.map(c => ({ text: c.text })) });

  } catch (error) {
    console.error("User casts API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
