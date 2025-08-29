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
          usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS ? 'SET' : 'NOT_SET',
          baseProjectId: process.env.NEXT_PUBLIC_BASE_PROJECT_ID ? 'SET' : 'NOT_SET',
          appUrl: process.env.NEXT_PUBLIC_APP_URL,
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

    // Test API key with multiple endpoints and methods
    console.log("🧪 Testing API key with Warpcast API...")

    const testConfigurations = [
      {
        name: "User Info (v2)",
        url: "https://api.warpcast.com/v2/me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "AddPlayButton-MiniApp/1.0",
        },
      },
      {
        name: "User Info (v1)",
        url: "https://api.warpcast.com/v1/me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "AddPlayButton-MiniApp/1.0",
        },
      },
      {
        name: "User Info (X-API-Key)",
        url: "https://api.warpcast.com/v2/me",
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          "User-Agent": "AddPlayButton-MiniApp/1.0",
        },
      },
      {
        name: "Casts Endpoint Test",
        url: "https://api.warpcast.com/v2/casts",
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "AddPlayButton-MiniApp/1.0",
        },
      },
    ]

    const testResults = []

    for (const config of testConfigurations) {
      try {
        console.log(`🧪 Testing ${config.name}...`)

        const testResponse = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
        })

        const testResult = await testResponse.text()

        console.log(`🧪 ${config.name} result:`, {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText,
          responsePreview: testResult.substring(0, 200),
          headers: Object.fromEntries(testResponse.headers.entries()),
        })

        testResults.push({
          name: config.name,
          url: config.url,
          method: config.method,
          success: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText,
          responsePreview: testResult.substring(0, 100),
          authMethod: config.headers.Authorization ? "Bearer" : "X-API-Key",
        })

        // If this test passed, we can stop here for basic validation
        if (testResponse.ok && config.name === "User Info (v2)") {
          break
        }
      } catch (testError) {
        console.error(`🧪 ${config.name} error:`, testError)
        testResults.push({
          name: config.name,
          url: config.url,
          method: config.method,
          success: false,
          error: testError instanceof Error ? testError.message : "Unknown error",
        })
      }
    }

    // Analyze test results
    const successfulTests = testResults.filter((result) => result.success)
    const failedTests = testResults.filter((result) => !result.success)

    console.log("🧪 Test summary:", {
      total: testResults.length,
      successful: successfulTests.length,
      failed: failedTests.length,
      successfulTests: successfulTests.map((t) => t.name),
      failedTests: failedTests.map((t) => t.name),
    })

    if (successfulTests.length === 0) {
      // All tests failed
      const authErrors = failedTests.filter((test) => test.status === 401)

      if (authErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: "API key authentication failed",
          details: "The API key was rejected by all Warpcast API endpoints",
          recommendations: [
            "🔑 Verify the API key is correct and complete",
            "⏰ Check if the API key has expired or been revoked",
            "🔄 Try regenerating the API key from Warpcast developer dashboard",
            "👤 Ensure your Warpcast account is in good standing",
            "🔒 Verify the key has the required permissions",
            "🌍 Check if you're using the correct API key for your environment",
            "📋 Make sure there are no extra spaces or characters in the key",
            "🚫 Check for any account restrictions or suspensions",
          ],
          debugInfo: {
            keyType,
            keyLength: apiKey.length,
            keyPrefix: apiKey.substring(0, 15),
            testResults,
            authErrors: authErrors.length,
            testedEndpoints: testConfigurations.map((c) => c.name),
          },
        })
      }

      return NextResponse.json({
        success: false,
        error: "API key test failed",
        details: "All test endpoints failed (not authentication related)",
        recommendations: [
          "Check Warpcast API status at https://status.warpcast.com",
          "Verify your network connection",
          "Try again in a few minutes",
          "Check if there are any service outages",
        ],
        debugInfo: {
          keyType,
          testResults,
          testedEndpoints: testConfigurations.map((c) => c.name),
        },
      })
    }

    // At least one test passed
    const workingMethods = [...new Set(successfulTests.map((t) => t.authMethod))]
    const workingEndpoints = successfulTests.map((t) => t.name)

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
        workingAuthMethods: workingMethods,
        workingEndpoints: workingEndpoints,
      },
      debugInfo: {
        testResults,
        testedEndpoints: testConfigurations.map((c) => c.name),
        successfulTests: successfulTests.length,
        failedTests: failedTests.length,
        summary: {
          totalTests: testResults.length,
          passedTests: successfulTests.length,
          failedTests: failedTests.length,
          authenticationWorks: successfulTests.length > 0,
        },
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
