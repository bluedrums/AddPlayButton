import { type NextRequest, NextResponse } from "next/server"

interface CastEmbed {
  url: string
}

interface CastRequest {
  text: string
  embeds?: CastEmbed[]
  userId: number
}

export async function POST(request: NextRequest) {
  try {
    const { text, embeds, userId }: CastRequest = await request.json()

    if (!text || !userId) {
      return NextResponse.json({ error: "Text and userId are required" }, { status: 400 })
    }

    const apiKey = process.env.WARPCAST_API_KEY

    if (!apiKey) {
      // Demo mode - simulate success
      console.log("Demo mode: Would create cast:", { text, embeds, userId })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return NextResponse.json({
        success: true,
        cast: {
          hash: "demo-cast-hash",
          text,
          embeds,
          author: { fid: userId },
        },
        message: "Demo cast created (no real API key configured)",
      })
    }

    // Real API call to Warpcast
    const castData = {
      text,
      embeds: embeds?.map((embed) => ({ url: embed.url })) || [],
    }

    const response = await fetch("https://api.warpcast.com/v2/casts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(castData),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Warpcast API error:", responseData)
      return NextResponse.json(
        { error: responseData.errors?.[0]?.message || "Failed to create cast" },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      cast: responseData.result.cast,
      message: "Cast created successfully",
    })
  } catch (error) {
    console.error("Cast creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
