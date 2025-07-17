import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ success: false, error: "FID is required" }, { status: 400 })
    }

    // For demo purposes, return mock casts
    // In a real implementation, this would query the Farcaster API or database
    const mockCasts = [
      {
        id: "cast_1",
        hash: "0xdemo123",
        text: "🎵 Check out this amazing track on Spotify!",
        timestamp: Date.now() - 3600000, // 1 hour ago
        embedUrl: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
        embedType: "spotify",
        warpcastUrl: "https://warpcast.com/~/conversations/0xdemo123",
      },
      {
        id: "cast_2",
        hash: "0xdemo456",
        text: "🎵 Amazing video on YouTube!",
        timestamp: Date.now() - 7200000, // 2 hours ago
        embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        embedType: "youtube",
        warpcastUrl: "https://warpcast.com/~/conversations/0xdemo456",
      },
    ]

    return NextResponse.json({
      success: true,
      casts: mockCasts,
    })
  } catch (error) {
    console.error("User casts API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
