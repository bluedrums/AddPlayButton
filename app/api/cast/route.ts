import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, embeds, playButton } = body

    console.log("🎵 Cast creation request:", {
      textLength: text?.length,
      embedsCount: embeds?.length,
      playButton: playButton ? `${playButton.platform}: ${playButton.title}` : "none",
      hasWarpcastKey: !!process.env.WARPCAST_API_KEY,
    })

    // Check if we have the WARPCAST_API_KEY environment variable
    if (!process.env.WARPCAST_API_KEY) {
      console.log("🎭 No WARPCAST_API_KEY - using demo mode")

      // Simulate cast creation delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockCastHash = `0x${Math.random().toString(16).substring(2, 18)}`
      return NextResponse.json({
        success: true,
        cast: {
          hash: mockCastHash,
          author: {
            fid: 12345,
            username: "demo_user",
          },
          text: text,
          timestamp: Date.now(),
        },
        warpcastUrl: `https://warpcast.com/demo_user/${mockCastHash.substring(0, 10)}`,
        isDemo: true,
      })
    }

    console.log("🚀 Creating real cast with WARPCAST_API_KEY")

    // Get user's session token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No authorization token provided")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)

    // For demo tokens, still use demo mode even with API key
    if (token.startsWith("demo_token_")) {
      console.log("🎭 Demo token detected - using demo mode")

      await new Promise((resolve) => setTimeout(resolve, 2000))
      const mockCastHash = `0x${Math.random().toString(16).substring(2, 18)}`

      return NextResponse.json({
        success: true,
        cast: {
          hash: mockCastHash,
          author: {
            fid: 12345,
            username: "demo_user",
          },
          text: text,
          timestamp: Date.now(),
        },
        warpcastUrl: `https://warpcast.com/demo_user/${mockCastHash.substring(0, 10)}`,
        isDemo: true,
      })
    }

    // Prepare cast data for Warpcast API
    const castData: any = {
      text: text.trim(),
    }

    // Add embeds if provided - this will include both the music URL and miniapp frame
    if (embeds && embeds.length > 0) {
      castData.embeds = embeds.map((embed: any) => ({
        url: embed.url,
      }))
    }

    console.log("📡 Sending cast to Warpcast API:", {
      textLength: castData.text.length,
      embedCount: castData.embeds?.length || 0,
      apiKeyPrefix: process.env.WARPCAST_API_KEY?.substring(0, 8) + "...",
    })

    // Create cast using Warpcast API with the environment variable
    const response = await fetch("https://api.warpcast.com/v2/casts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(castData),
    })

    console.log("📡 Warpcast API response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Warpcast API error:", errorText)

      let errorMessage = "Failed to create cast"
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        errorMessage = `API Error: ${response.status} ${response.statusText}`
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: response.status },
      )
    }

    const castResult = await response.json()
    console.log("✅ Cast created successfully:", {
      hash: castResult.result?.cast?.hash?.substring(0, 10),
      author: castResult.result?.cast?.author?.username,
    })

    // Return successful response
    return NextResponse.json({
      success: true,
      cast: {
        hash: castResult.result.cast.hash,
        author: {
          fid: castResult.result.cast.author.fid,
          username: castResult.result.cast.author.username,
        },
        text: castResult.result.cast.text,
        timestamp: castResult.result.cast.timestamp,
      },
      warpcastUrl: `https://warpcast.com/${castResult.result.cast.author.username}/${castResult.result.cast.hash.substring(0, 10)}`,
      isDemo: false,
    })
  } catch (error) {
    console.error("💥 Cast creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
