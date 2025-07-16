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

    // Test API key by making requests to different endpoints
    console.log("🧪 Testing API key with Warpcast API...")

    const testEndpoints = [
      {
        name: "User Info",
        url: "https://api.warpcast.com/v2/me",
        method: "GET",
      },
      {
        name: "User Verification",
        url: "https://api.warpcast.com/v2/verifications",
        method: "GET",
      },
    ]

    const testResults = []

    for (const endpoint of testEndpoints) {
      try {
        // Try different authentication methods
        const authMethods = [
          {
            name: "Bearer Token",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "User-Agent": "AddPlayButton-MiniApp/1.0",
            },
          },
        ]

        // Add alternative methods for wc_secret_ keys
        if (apiKey.startsWith("wc_secret_")) {
          authMethods.push(
            {
              name: "X-API-Key Header",
              headers: {
                "X-API-Key": apiKey,
                "Content-Type": "application/json",
                "User-Agent": "AddPlayButton-MiniApp/1.0",
              },
            },
            {
              name: "X-Farcaster-Auth Header",
              headers: {
                "X-Farcaster-Auth": apiKey,
                "Content-Type": "application/json",
                "User-Agent": "AddPlayButton-MiniApp/1.0",
              },
            },
          )
        }

        let successfulMethod = null
        let lastError = null

        for (const authMethod of authMethods) {
          try {
            const testResponse = await fetch(endpoint.url, {
              method: endpoint.method,
              headers: authMethod.headers,
            })

            const testResult = await testResponse.text()

            console.log(`🧪 ${endpoint.name} test (${authMethod.name}):`, {
              status: testResponse.status,
              ok: testResponse.ok,
              statusText: testResponse.statusText,
              responsePreview: testResult.substring(0, 200),
            })

            if (testResponse.ok) {
              successfulMethod = authMethod.name
              testResults.push({
                endpoint: endpoint.name,
                success: true,
                status: testResponse.status,
                authMethod: authMethod.name,
                responsePreview: testResult.substring(0, 100),
              })
              break // Success, no need to try other auth methods
            } else {
              lastError = {
                status: testResponse.status,
                statusText: testResponse.statusText,
                authMethod: authMethod.name,
                responsePreview: testResult.substring(0, 100),
              }
            }
          } catch (methodError) {
            lastError = {
              authMethod: authMethod.name,
              error: methodError instanceof Error ? methodError.message : "Unknown error",
            }
          }
        }

        if (!successfulMethod) {
          testResults.push({
            endpoint: endpoint.name,
            success: false,
            error: lastError,
          })
        }
      } catch (endpointError) {
        console.error(`🧪 ${endpoint.name} test error:`, endpointError)
        testResults.push({
          endpoint: endpoint.name,
          success: false,
          error: endpointError instanceof Error ? endpointError.message : "Unknown error",
        })
      }
    }

    // Analyze test results
    const successfulTests = testResults.filter((result) => result.success)
    const failedTests = testResults.filter((result) => !result.success)

    if (successfulTests.length === 0) {
      // All tests failed
      const authErrors = failedTests.filter((test) => test.error?.status === 401)

      if (authErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: "API key authentication failed",
          details: "The API key was rejected by Warpcast API",
          recommendations: [
            "Verify the API key is correct and hasn't been revoked",
            "Check if the API key has expired",
            "Try regenerating the API key from Warpcast developer dashboard",
            "Ensure the key has the required permissions",
            "Check if your Warpcast account is in good standing",
            "Verify you're using the correct API key for your environment",
          ],
          debugInfo: {
            keyType,
            keyLength: apiKey.length,
            keyPrefix: apiKey.substring(0, 15),
            testResults,
            testedEndpoints: testEndpoints.map((e) => e.name),
          },
        })
      }

      return NextResponse.json({
        success: false,
        error: "API key test failed",
        details: "All test endpoints failed",
        recommendations: [
          "Check Warpcast API status",
          "Verify your network connection",
          "Try again in a few minutes",
          "Check if there are any service outages",
        ],
        debugInfo: {
          keyType,
          testResults,
          testedEndpoints: testEndpoints.map((e) => e.name),
        },
      })
    }

    // At least one test passed
    return NextResponse.json({
      success: true,
      message: "API key is valid and working",
      details: {
        keyType,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 15),
        isValidLength: true,
        isValidFormat: true,
        apiTestsPassed: successfulTests.length,
        apiTestsFailed: failedTests.length,
        workingAuthMethods: [...new Set(successfulTests.map((t) => t.authMethod))],
      },
      debugInfo: {
        testResults,
        testedEndpoints: testEndpoints.map((e) => e.name),
        successfulTests: successfulTests.length,
        failedTests: failedTests.length,
      },
    })
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
