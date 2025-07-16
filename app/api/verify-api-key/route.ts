import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.WARPCAST_API_KEY

    console.log("🔍 API Key verification request:", {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 15) || "none",
      timestamp: new Date().toISOString(),
    })

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "WARPCAST_API_KEY not found",
        details: "Environment variable WARPCAST_API_KEY is not set",
        recommendations: [
          "Add WARPCAST_API_KEY to your .env.local file",
          "Get an API key from https://warpcast.com/~/developers",
          "Format should be: WARPCAST_API_KEY=MK-xxxxxxxx or WARPCAST_API_KEY=wc_secret_xxxxxxxx",
          "Restart your development server after adding the key",
        ],
        debugInfo: {
          nodeEnv: process.env.NODE_ENV,
          hasEnvFile: !!process.env.NEXT_PUBLIC_APP_URL,
        },
      })
    }

    // Check API key format
    const isValidFormat = apiKey.startsWith("MK-") || apiKey.startsWith("wc_secret_")
    const keyType = apiKey.startsWith("MK-")
      ? "Merkle"
      : apiKey.startsWith("wc_secret_")
        ? "Warpcast Secret"
        : "Unknown"

    console.log("🔐 API Key format check:", {
      isValidFormat,
      keyType,
      length: apiKey.length,
      startsWithMK: apiKey.startsWith("MK-"),
      startsWithWcSecret: apiKey.startsWith("wc_secret_"),
    })

    if (!isValidFormat) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key format",
        details: `API key should start with 'MK-' or 'wc_secret_', but starts with '${apiKey.substring(0, 15)}...'`,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 15),
        recommendations: [
          "Check that you copied the full API key from Warpcast",
          "Merkle keys start with MK- (typically 40-60 characters)",
          "Warpcast secret keys start with wc_secret_ (typically 80-120 characters)",
          "Remove any extra spaces or newlines from the key",
          "Ensure you're using the API key, not a different type of token",
        ],
        debugInfo: {
          actualPrefix: apiKey.substring(0, 15),
          expectedPrefixes: ["MK-", "wc_secret_"],
          keyLength: apiKey.length,
        },
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
          "Check for hidden characters or encoding issues",
        ],
        debugInfo: {
          keyType: prefix,
          actualLength: apiKey.length,
          expectedRange: `${expected.min}-${expected.max}`,
          tooShort: apiKey.length < expected.min,
          tooLong: apiKey.length > expected.max,
        },
      })
    }

    // Test API key by making a simple request to Warpcast API
    console.log("🧪 Testing API key with Warpcast API...")

    try {
      const testResponse = await fetch("https://api.warpcast.com/v2/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "AddPlayButton-MiniApp/1.0",
        },
      })

      const testResult = await testResponse.text()

      console.log("🧪 API key test result:", {
        status: testResponse.status,
        ok: testResponse.ok,
        statusText: testResponse.statusText,
        responsePreview: testResult.substring(0, 200),
      })

      if (testResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: "API key authentication failed",
          details: "The API key was rejected by Warpcast API",
          recommendations: [
            "Verify the API key is correct and hasn't been revoked",
            "Check if the API key has expired",
            "Try regenerating the API key from Warpcast developer dashboard",
            "Ensure the key has the required permissions",
          ],
          debugInfo: {
            keyType,
            keyLength: apiKey.length,
            keyPrefix: apiKey.substring(0, 15),
            testEndpoint: "https://api.warpcast.com/v2/me",
            testStatus: testResponse.status,
            testStatusText: testResponse.statusText,
          },
        })
      }

      if (!testResponse.ok) {
        return NextResponse.json({
          success: false,
          error: "API key test failed",
          details: `Warpcast API returned ${testResponse.status}: ${testResponse.statusText}`,
          recommendations: [
            "Check Warpcast API status",
            "Verify your network connection",
            "Try again in a few minutes",
          ],
          debugInfo: {
            keyType,
            testStatus: testResponse.status,
            testStatusText: testResponse.statusText,
            responsePreview: testResult.substring(0, 100),
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: "API key is valid and working",
        details: {
          keyType,
          keyLength: apiKey.length,
          keyPrefix: apiKey.substring(0, 15),
          isValidLength: true,
          isValidFormat: true,
          apiTestPassed: true,
        },
        debugInfo: {
          testEndpoint: "https://api.warpcast.com/v2/me",
          testStatus: testResponse.status,
          testStatusText: testResponse.statusText,
        },
      })
    } catch (testError) {
      console.error("🧪 API key test error:", testError)

      return NextResponse.json({
        success: false,
        error: "Failed to test API key",
        details: "Could not connect to Warpcast API for testing",
        recommendations: ["Check your internet connection", "Verify Warpcast API is accessible", "Try again later"],
        debugInfo: {
          keyType,
          keyLength: apiKey.length,
          keyPrefix: apiKey.substring(0, 15),
          testError: testError instanceof Error ? testError.message : "Unknown error",
        },
      })
    }
  } catch (error) {
    console.error("💥 API key verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify API key",
        details: error instanceof Error ? error.message : "Unknown error",
        debugInfo: {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    )
  }
}
