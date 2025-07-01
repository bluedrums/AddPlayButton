import { type NextRequest, NextResponse } from "next/server"
import { formatCastText, validateCastData } from "@/lib/farcaster"

export async function POST(request: NextRequest) {
  try {
    const { fid, text, embedUrl, embedType, title, signerUuid } = await request.json()

    if (!fid || !embedUrl || !embedType || !signerUuid) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Format the cast text
    const castText = text || formatCastText(embedType, title)
    const embeds = [embedUrl]

    // Validate cast data
    const validation = validateCastData(castText, embeds)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Submit cast to Farcaster Hub
    const castData = {
      text: castText,
      embeds: embeds.map((url) => ({ url })),
      embedsDeprecated: embeds,
    }

    // Use Warpcast API for casting
    const response = await fetch("https://api.warpcast.com/v2/casts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
      },
      body: JSON.stringify({
        text: castData.text,
        embeds: castData.embeds,
        parent: null, // Top-level cast
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create cast")
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      cast: {
        hash: result.result.cast.hash,
        author: {
          fid: result.result.cast.author.fid,
          username: result.result.cast.author.username,
        },
        text: result.result.cast.text,
        timestamp: result.result.cast.timestamp,
        warpcastUrl: `https://warpcast.com/${result.result.cast.author.username}/${result.result.cast.hash.slice(0, 10)}`,
      },
    })
  } catch (error: any) {
    console.error("Cast creation error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to create cast" }, { status: 500 })
  }
}
