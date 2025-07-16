import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.WARPCAST_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "WARPCAST_API_KEY not found",
        details: "Environment variable WARPCAST_API_KEY is not set",
        recommendations: [
          "Add WARPCAST_API_KEY to your .env.local file",
          "Get an API key from https://warpcast.com/~/developers",
          "Format should be: WARPCAST_API_KEY=MK-xxxxxxxx or WARPCAST_API_KEY=wc_secret_xxxxxxxx",
        ],
      })
    }

    // Check API key format
    const isValidFormat = apiKey.startsWith("MK-") || apiKey.startsWith("wc_secret_")

    if (!isValidFormat) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key format",
        details: `API key should start with 'MK-' or 'wc_secret_', but starts with '${apiKey.substring(0, 10)}...'`,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 10),
        recommendations: [
          "Check that you copied the full API key from Warpcast",
          "Merkle keys start with MK- (typically 40-60 characters)",
          "Warpcast secret keys start with wc_secret_ (typically 80-120 characters)",
          "Remove any extra spaces or newlines from the key",
        ],
      })
    }

    // Additional validation for key length
    const expectedLengths = {
      "MK-": { min: 40, max: 60 },
      wc_secret_: { min: 80, max: 120 },
    }

    const prefix = apiKey.startsWith("MK-") ? "MK-" : "wc_secret_"
    const expected = expectedLengths[prefix]

    if (apiKey.length < expected.min || apiKey.length > expected.max) {
      return NextResponse.json({
        success: false,
        error: "API key length seems incorrect",
        details: `${prefix} keys should be ${expected.min}-${expected.max} characters, but yours is ${apiKey.length}`,
        keyLength: apiKey.length,
        keyPrefix: prefix,
        recommendations: [
          "Double-check that you copied the complete API key",
          "Make sure there are no extra characters or truncation",
          "Try regenerating the API key from Warpcast if needed",
        ],
      })
    }

    return NextResponse.json({
      success: true,
      message: "API key format appears valid",
      details: {
        keyType: prefix === "MK-" ? "Merkle Key" : "Warpcast Secret Key",
        keyLength: apiKey.length,
        keyPrefix: prefix,
        isValidLength: true,
        isValidFormat: true,
      },
    })
  } catch (error) {
    console.error("Error verifying API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
