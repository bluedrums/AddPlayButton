import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, embeds, userId } = body

    console.log("🎵 Cast API called:", {
      textLength: text?.length,
      embedsCount: embeds?.length || 0,
      userId,
      hasWarpcastKey: !!process.env.WARPCAST_API_KEY,
      timestamp: new Date().toISOString(),
    })

    if (!text || !userId) {
      console.error("❌ Missing required fields:", { hasText: !!text, hasUserId: !!userId })
      return NextResponse.json({ error: "Text and userId are required" }, { status: 400 })
    }

    const apiKey = process.env.WARPCAST_API_KEY

    if (!apiKey) {
      console.log("🎭 No WARPCAST_API_KEY - using demo mode")

      // Demo mode - simulate success
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockCastHash = `0x${Math.random().toString(16).substring(2, 18)}`

      return NextResponse.json({
        success: true,
        cast: {
          hash: mockCastHash,
          text,
          embeds: embeds || [],
          author: {
            fid: userId,
            username: "demo_user",
          },
          timestamp: Date.now(),
        },
        warpcastUrl: `https://warpcast.com/demo_user/${mockCastHash.substring(0, 10)}`,
        isDemo: true,
        message: "Demo cast created (no real API key configured)",
      })
    }

    // Validate API key format
    const isValidFormat = apiKey.startsWith("MK-") || apiKey.startsWith("wc_secret_")

    console.log("🔐 API Key validation:", {
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 15),
      isValidFormat,
      startsWithMK: apiKey.startsWith("MK-"),
      startsWithWcSecret: apiKey.startsWith("wc_secret_"),
    })

    if (!isValidFormat) {
      console.error("❌ Invalid WARPCAST_API_KEY format:", {
        length: apiKey.length,
        prefix: apiKey.substring(0, 15),
        expectedPrefixes: ["MK-", "wc_secret_"],
      })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key format",
          details: {
            currentPrefix: apiKey.substring(0, 15),
            expectedPrefixes: ["MK-", "wc_secret_"],
            keyLength: apiKey.length,
            suggestion: "Check your WARPCAST_API_KEY environment variable format",
          },
        },
        { status: 500 },
      )
    }

    // Prepare cast data for Warpcast API
    const castData = {
      text: text.trim(),
      embeds: embeds?.map((embed: any) => ({ url: embed.url })) || [],
    }

    console.log("📡 Sending to Warpcast API:", {
      textLength: castData.text.length,
      embedCount: castData.embeds.length,
      apiUrl: "https://api.warpcast.com/v2/casts",
      authMethod: "Bearer token",
      keyType: apiKey.startsWith("MK-") ? "Merkle" : "Warpcast Secret",
    })

    // Determine the correct authentication method based on key type
    let authHeaders: Record<string, string>

    if (apiKey.startsWith("MK-")) {
      // Merkle API keys use Bearer authentication
      authHeaders = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "AddPlayButton-MiniApp/1.0",
      }
    } else if (apiKey.startsWith("wc_secret_")) {
      // Warpcast secret keys might use different authentication
      // Try both Bearer and direct token approaches
      authHeaders = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "AddPlayButton-MiniApp/1.0",
        "X-API-Key": apiKey, // Alternative header
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported API key type",
          details: {
            keyPrefix: apiKey.substring(0, 15),
            supportedTypes: ["MK-", "wc_secret_"],
          },
        },
        { status: 400 },
      )
    }

    console.log("🔑 Auth headers prepared:", {
      hasAuthorization: !!authHeaders.Authorization,
      hasXApiKey: !!authHeaders["X-API-Key"],
      authPrefix: authHeaders.Authorization?.substring(0, 20),
    })

    // Make request to Warpcast API
    const response = await fetch("https://api.warpcast.com/v2/casts", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(castData),
    })

    const responseText = await response.text()

    console.log("📡 Warpcast API response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200),
      allHeaders: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      console.error("❌ Warpcast API error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseBody: responseText,
        requestData: castData,
        authHeaders: {
          ...authHeaders,
          Authorization: authHeaders.Authorization?.substring(0, 20) + "...",
          "X-API-Key": authHeaders["X-API-Key"]?.substring(0, 20) + "...",
        },
      })

      // Try alternative authentication method if Bearer failed
      if (response.status === 401 && apiKey.startsWith("wc_secret_")) {
        console.log("🔄 Trying alternative authentication method...")

        const altAuthHeaders = {
          "Content-Type": "application/json",
          "User-Agent": "AddPlayButton-MiniApp/1.0",
          "X-Farcaster-Auth": apiKey, // Alternative auth header
        }

        const altResponse = await fetch("https://api.warpcast.com/v2/casts", {
          method: "POST",
          headers: altAuthHeaders,
          body: JSON.stringify(castData),
        })

        const altResponseText = await altResponse.text()

        console.log("🔄 Alternative auth response:", {
          status: altResponse.status,
          statusText: altResponse.statusText,
          ok: altResponse.ok,
          responsePreview: altResponseText.substring(0, 200),
        })

        if (altResponse.ok) {
          // Alternative method worked
          let result
          try {
            result = JSON.parse(altResponseText)
          } catch (parseError) {
            console.error("❌ Failed to parse alternative response:", parseError)
            return NextResponse.json(
              {
                success: false,
                error: "Invalid response from Warpcast API",
                details: {
                  issue: "Response was not valid JSON",
                  responsePreview: altResponseText.substring(0, 200),
                  parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
                },
              },
              { status: 500 },
            )
          }

          console.log("✅ Cast created with alternative auth:", {
            hash: result.result?.cast?.hash?.substring(0, 10),
            author: result.result?.cast?.author?.username,
          })

          let warpcastUrl = null
          if (result.result?.cast?.hash && result.result?.cast?.author?.username) {
            warpcastUrl = `https://warpcast.com/${result.result.cast.author.username}/${result.result.cast.hash.substring(0, 10)}`
          }

          return NextResponse.json({
            success: true,
            cast: result.result.cast,
            warpcastUrl,
            isDemo: false,
            message: "Cast created successfully (alternative auth)",
          })
        }
      }

      // Handle specific error cases with detailed debugging
      let errorMessage = "Failed to create cast"
      let errorDetails: any = {
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseText,
      }

      if (response.status === 401) {
        errorMessage = "Authentication failed"

        // Parse the error response to get more details
        let parsedError
        try {
          parsedError = JSON.parse(responseText)
        } catch (e) {
          parsedError = { message: responseText }
        }

        errorDetails = {
          ...errorDetails,
          issue: "Invalid or expired API key",
          warpcastError: parsedError,
          suggestions: [
            "Verify your WARPCAST_API_KEY is correct and complete",
            "Check if the API key has expired or been revoked",
            "Ensure the key has proper permissions for casting",
            "Try regenerating the API key from Warpcast developer dashboard",
            "Check if your account is in good standing",
            "Verify the API key is for the correct environment (dev/prod)",
          ],
          apiKeyInfo: {
            length: apiKey.length,
            prefix: apiKey.substring(0, 15),
            type: apiKey.startsWith("MK-") ? "Merkle" : "Warpcast Secret",
            format: isValidFormat ? "valid" : "invalid",
          },
          debugInfo: {
            endpoint: "https://api.warpcast.com/v2/casts",
            method: "POST",
            authMethod: apiKey.startsWith("MK-") ? "Bearer (Merkle)" : "Bearer (Warpcast Secret)",
            requestHeaders: Object.keys(authHeaders),
            responseHeaders: Object.fromEntries(response.headers.entries()),
          },
        }
      } else if (response.status === 400) {
        let parsedError
        try {
          parsedError = JSON.parse(responseText)
        } catch (e) {
          parsedError = { message: responseText }
        }

        errorMessage = "Invalid cast data"
        errorDetails = {
          ...errorDetails,
          issue: parsedError.message || "Bad request format",
          validationErrors: parsedError.errors || [],
          requestData: castData,
          suggestions: [
            "Check cast text length (max 320 characters)",
            "Verify embed URLs are valid and accessible",
            "Ensure all required fields are present",
            "Check for invalid characters in the text",
          ],
        }
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded"
        errorDetails = {
          ...errorDetails,
          issue: "Too many requests",
          retryAfter: response.headers.get("retry-after"),
          suggestions: ["Wait before trying again", "Implement exponential backoff", "Check your API usage limits"],
        }
      } else if (response.status === 403) {
        errorMessage = "Forbidden"
        errorDetails = {
          ...errorDetails,
          issue: "API key lacks required permissions",
          suggestions: [
            "Check API key permissions in Warpcast dashboard",
            "Ensure the key can create casts",
            "Verify account status and limits",
            "Check if casting is enabled for your account",
          ],
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorDetails,
        },
        { status: response.status },
      )
    }

    // Parse successful response
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error("❌ Failed to parse Warpcast response:", {
        error: parseError,
        responseText: responseText.substring(0, 500),
      })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from Warpcast API",
          details: {
            issue: "Response was not valid JSON",
            responsePreview: responseText.substring(0, 200),
            parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
          },
        },
        { status: 500 },
      )
    }

    console.log("✅ Cast created successfully:", {
      hash: result.result?.cast?.hash?.substring(0, 10),
      author: result.result?.cast?.author?.username,
      timestamp: result.result?.cast?.timestamp,
      fullResult: result,
    })

    // Generate Warpcast URL
    let warpcastUrl = null
    if (result.result?.cast?.hash && result.result?.cast?.author?.username) {
      warpcastUrl = `https://warpcast.com/${result.result.cast.author.username}/${result.result.cast.hash.substring(0, 10)}`
    }

    return NextResponse.json({
      success: true,
      cast: result.result.cast,
      warpcastUrl,
      isDemo: false,
      message: "Cast created successfully",
    })
  } catch (error) {
    console.error("💥 Cast creation error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })

    let errorMessage = "Internal server error"
    let errorDetails: any = {
      timestamp: new Date().toISOString(),
    }

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        ...errorDetails,
        name: error.name,
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 5), // First 5 lines of stack trace
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
