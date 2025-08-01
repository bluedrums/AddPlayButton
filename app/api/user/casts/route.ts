import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ success: false, error: "FID is required" }, { status: 400 })
    }

    const WARPCAST_API_KEY = process.env.WARPCAST_API_KEY;
    if (!WARPCAST_API_KEY) {
      console.error('WARPCAST_API_KEY is not set in the environment variables.');
      return NextResponse.json({ error: 'Server configuration error: Warpcast API key is missing.' }, { status: 500 });
    }

    const res = await fetch(`https://api.warpcast.com/v2/casts?fid=${fid}&limit=100`, {
      headers: {
        Authorization: `Bearer ${WARPCAST_API_KEY}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Warpcast API error:", errorText);
      return NextResponse.json({ success: false, error: "Failed to fetch casts from Warpcast" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, casts: data.result.casts.map((c: any) => ({ text: c.text })) });
  } catch (error) {
    console.error("User casts API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
