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

    // Prepare cast data - Use the correct Warpcast API format
    const castData = {
      text: text.trim(),
      embeds: embeds?.map((embed: any) => ({ url: embed.url })) || [],
      parent: null, // No parent for top-level casts
    }

    console.log("📡 Preparing Warpcast API request:", {
      textLength: castData.text.length,
      embedCount: castData.embeds.length,
      keyType: apiKey.startsWith("MK-") ? "Merkle" : "Warpcast Secret",
    })

    // Use the correct Warpcast API endpoint and authentication
    // Based on Warpcast API docs, the correct endpoint is /v2/casts
    const apiUrl = "https://api.warpcast.com/v2/casts"

    const requestHeaders = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "AddPlayButton-MiniApp/1.0",
    }

    console.log("🔑 Request headers:", {
      hasAuthorization: !!requestHeaders.Authorization,
      authPrefix: requestHeaders.Authorization.substring(0, 20),
      contentType: requestHeaders["Content-Type"],
      userAgent: requestHeaders["User-Agent"],
    })

    console.log("📤 Sending request to:", apiUrl)
    console.log("📤 Request body:", JSON.stringify(castData, null, 2))

    // Make request to Warpcast API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(castData),
    })

    const responseText = await response.text()

    console.log("📡 Warpcast API response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 300),
      allHeaders: Object.fromEntries(response.headers.entries()),
    })

    // If we get 401, try alternative approaches
    if (response.status === 401) {
      console.log("🔄 Got 401, trying alternative authentication methods...")

      // Try with PUT method (some APIs use PUT for creates)
      const putResponse = await fetch(apiUrl, {
        method: "PUT",
        headers: requestHeaders,
        body: JSON.stringify(castData),
      })

      const putResponseText = await putResponse.text()
      console.log("🔄 PUT method response:", {
        status: putResponse.status,
        ok: putResponse.ok,
        responsePreview: putResponseText.substring(0, 200),
      })

      if (putResponse.ok) {
        // PUT method worked
        let result
        try {
          result = JSON.parse(putResponseText)
        } catch (parseError) {
          console.error("❌ Failed to parse PUT response:", parseError)
          return NextResponse.json(
            {
              success: false,
              error: "Invalid response from Warpcast API",
              details: {
                issue: "Response was not valid JSON",
                responsePreview: putResponseText.substring(0, 200),
                method: "PUT",
              },
            },
            { status: 500 },
          )
        }

        console.log("✅ Cast created with PUT method:", result)

        return NextResponse.json({
          success: true,
          cast: result.result?.cast || result.cast,
          warpcastUrl: result.result?.cast?.hash
            ? `https://warpcast.com/~/conversations/${result.result.cast.hash}`
            : null,
          isDemo: false,
          message: "Cast created successfully (PUT method)",
        })
      }

      // Try with different API endpoint
      const altApiUrl = "https://api.warpcast.com/v1/casts"
      console.log("🔄 Trying alternative endpoint:", altApiUrl)

      const altResponse = await fetch(altApiUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(castData),
      })

      const altResponseText = await altResponse.text()
      console.log("🔄 Alternative endpoint response:", {
        status: altResponse.status,
        ok: altResponse.ok,
        responsePreview: altResponseText.substring(0, 200),
      })

      if (altResponse.ok) {
        // Alternative endpoint worked
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
                endpoint: "v1",
              },
            },
            { status: 500 },
          )
        }

        console.log("✅ Cast created with alternative endpoint:", result)

        return NextResponse.json({
          success: true,
          cast: result.result?.cast || result.cast,
          warpcastUrl: result.result?.cast?.hash
            ? `https://warpcast.com/~/conversations/${result.result.cast.hash}`
            : null,
          isDemo: false,
          message: "Cast created successfully (v1 endpoint)",
        })
      }

      // Try with API key in different header format
      const altHeaders = {
        "Content-Type": "application/json",
        "User-Agent": "AddPlayButton-MiniApp/1.0",
        "X-API-Key": apiKey,
      }

      console.log("🔄 Trying X-API-Key header format...")

      const headerResponse = await fetch(apiUrl, {
        method: "POST",
        headers: altHeaders,
        body: JSON.stringify(castData),
      })

      const headerResponseText = await headerResponse.text()
      console.log("🔄 X-API-Key header response:", {
        status: headerResponse.status,
        ok: headerResponse.ok,
        responsePreview: headerResponseText.substring(0, 200),
      })

      if (headerResponse.ok) {
        // X-API-Key header worked
        let result
        try {
          result = JSON.parse(headerResponseText)
        } catch (parseError) {
          console.error("❌ Failed to parse header response:", parseError)
          return NextResponse.json(
            {
              success: false,
              error: "Invalid response from Warpcast API",
              details: {
                issue: "Response was not valid JSON",
                responsePreview: headerResponseText.substring(0, 200),
                authMethod: "X-API-Key",
              },
            },
            { status: 500 },
          )
        }

        console.log("✅ Cast created with X-API-Key header:", result)

        return NextResponse.json({
          success: true,
          cast: result.result?.cast || result.cast,
          warpcastUrl: result.result?.cast?.hash
            ? `https://warpcast.com/~/conversations/${result.result.cast.hash}`
            : null,
          isDemo: false,
          message: "Cast created successfully (X-API-Key header)",
        })
      }
    }

    if (!response.ok) {
      console.error("❌ All authentication methods failed:", {
        originalStatus: response.status,
        originalResponse: responseText.substring(0, 500),
        apiKey: {
          length: apiKey.length,
          prefix: apiKey.substring(0, 15),
          type: apiKey.startsWith("MK-") ? "Merkle" : "Warpcast Secret",
        },
      })

      // Parse the error response to get more details
      let parsedError
      try {
        parsedError = JSON.parse(responseText)
      } catch (e) {
        parsedError = { message: responseText }
      }

      const errorMessage = "Authentication failed"
      const errorDetails: any = {
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        warpcastError: parsedError,
        issue: "API key was rejected by Warpcast API",
        suggestions: [
          "🔑 Verify your WARPCAST_API_KEY is correct and complete",
          "⏰ Check if the API key has expired or been revoked",
          "🔒 Ensure the key has proper permissions for casting",
          "🔄 Try regenerating the API key from Warpcast developer dashboard",
          "👤 Check if your Warpcast account is in good standing",
          "🌍 Verify the API key is for the correct environment",
          "📋 Make sure you copied the entire key without truncation",
          "🚫 Check if there are any account restrictions or rate limits",
        ],
        apiKeyInfo: {
          length: apiKey.length,
          prefix: apiKey.substring(0, 15),
          type: apiKey.startsWith("MK-") ? "Merkle" : "Warpcast Secret",
          format: isValidFormat ? "valid" : "invalid",
        },
        debugInfo: {
          endpoint: apiUrl,
          method: "POST",
          requestHeaders: Object.keys(requestHeaders),
          responseHeaders: Object.fromEntries(response.headers.entries()),
          triedAlternatives: true,
        },
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
    if (result.result?.cast?.hash) {
      warpcastUrl = `https://warpcast.com/~/conversations/${result.result.cast.hash}`
    }

    return NextResponse.json({
      success: true,
      cast: result.result?.cast || result.cast,
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
        stack: error.stack?.split("\n").slice(0, 5),
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
