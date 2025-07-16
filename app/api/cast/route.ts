import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, embeds, parentUrl } = body

    // Check if API key is configured
    const apiKey = process.env.WARPCAST_API_KEY

    if (!apiKey) {
      console.log("No WARPCAST_API_KEY found, using demo mode")
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: "Demo cast created (API key not configured)",
        cast: {
          hash: `demo_${Date.now()}`,
          text,
          embeds,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Validate API key format
    if (!apiKey.startsWith("MK-") && !apiKey.startsWith("wc_secret_")) {
      console.error("Invalid API key format:", apiKey.substring(0, 10) + "...")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key format",
          details: "API key should start with MK- or wc_secret_",
        },
        { status: 400 },
      )
    }

    // Prepare cast data
    const castData = {
      text: text || "",
      embeds: embeds || [],
      ...(parentUrl && { parent: parentUrl }),
    }

    console.log("Creating cast with data:", JSON.stringify(castData, null, 2))

    // Make request to Warpcast API
    const response = await fetch("https://api.warpcast.com/v2/casts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(castData),
    })

    const responseText = await response.text()
    console.log("Warpcast API response status:", response.status)
    console.log("Warpcast API response:", responseText)

    if (!response.ok) {
      let errorMessage = "Failed to create cast"
      let errorDetails = responseText

      // Handle specific error cases
      if (response.status === 401) {
        errorMessage = "Authentication failed"
        errorDetails = "Invalid or expired API key"
      } else if (response.status === 400) {
        errorMessage = "Invalid cast data"
        errorDetails = "Check cast text and embeds format"
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded"
        errorDetails = "Too many requests, please try again later"
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorDetails,
          statusCode: response.status,
        },
        { status: response.status },
      )
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse response:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from Warpcast API",
          details: "Response was not valid JSON",
        },
        { status: 500 },
      )
    }

    // Generate Warpcast URL if we have a cast hash
    let warpcastUrl = null
    if (result.cast?.hash) {
      warpcastUrl = `https://warpcast.com/~/conversations/${result.cast.hash}`
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      cast: result.cast,
      warpcastUrl,
      message: "Cast created successfully",
    })
  } catch (error) {
    console.error("Error creating cast:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
