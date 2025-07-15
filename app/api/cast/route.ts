import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { text, embeds } = await request.json()

    // Create cast using Warpcast API
    const response = await fetch("https://api.warpcast.com/v2/casts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        embeds: embeds || [],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create cast")
    }

    const castData = await response.json()

    return NextResponse.json({
      success: true,
      cast: castData.result.cast,
      warpcastUrl: `https://warpcast.com/${castData.result.cast.author.username}/${castData.result.cast.hash.substring(0, 10)}`,
    })
  } catch (error) {
    console.error("Cast creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create cast",
      },
      { status: 500 },
    )
  }
}
