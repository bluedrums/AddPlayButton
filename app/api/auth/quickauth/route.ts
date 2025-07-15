import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, domain, userAgent, referrer } = body

    console.log("🔄 QuickAuth API called:", { action, domain, userAgent: userAgent?.substring(0, 50) })

    // Check for Farcaster frame headers
    const farcasterUserFid = request.headers.get("x-farcaster-user-fid")
    const farcasterUserToken = request.headers.get("x-farcaster-user-token")
    const farcasterFrameContext = request.headers.get("x-farcaster-frame")

    console.log("📡 Frame headers:", {
      fid: farcasterUserFid,
      hasToken: !!farcasterUserToken,
      frameContext: farcasterFrameContext,
    })

    // Check if we have a real API key
    const apiKey = process.env.WARPCAST_API_KEY
    if (!apiKey) {
      console.log("⚠️ No WARPCAST_API_KEY found, using demo mode")
      return createDemoResponse()
    }

    // Try to get real user data if we have frame context
    if (farcasterUserFid && farcasterUserToken) {
      try {
        console.log("🔗 Attempting real Warpcast API call for FID:", farcasterUserFid)

        const userResponse = await fetch(`https://api.warpcast.com/v2/user?fid=${farcasterUserFid}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log("✅ Real user data retrieved:", userData.result?.user?.username)

          return NextResponse.json({
            success: true,
            user: {
              fid: userData.result.user.fid,
              username: userData.result.user.username,
              displayName: userData.result.user.displayName,
              pfpUrl: userData.result.user.pfp?.url,
              bio: userData.result.user.profile?.bio?.text,
              followerCount: userData.result.user.followerCount || 0,
              followingCount: userData.result.user.followingCount || 0,
              verifications: userData.result.user.verifications || [],
            },
            authType: "real",
            sessionToken: farcasterUserToken,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          })
        }
      } catch (error) {
        console.error("❌ Real API call failed:", error)
      }
    }

    // Check if request is coming from Warpcast based on referrer or user agent
    const isFromWarpcast =
      referrer?.includes("warpcast.com") ||
      userAgent?.includes("Warpcast") ||
      userAgent?.includes("farcaster") ||
      domain?.includes("warpcast")

    if (isFromWarpcast) {
      console.log("🎭 Warpcast context detected, creating enhanced demo user")
      return createEnhancedDemoResponse()
    }

    console.log("🎭 Creating standard demo response")
    return createDemoResponse()
  } catch (error) {
    console.error("❌ QuickAuth API error:", error)
    return createDemoResponse()
  }
}

function createDemoResponse() {
  return NextResponse.json({
    success: true,
    user: {
      fid: 12345,
      username: "demo_user",
      displayName: "Demo User",
      pfpUrl: "/placeholder-user.jpg",
      bio: "Demo user for testing the Add Play Button app",
      followerCount: 100,
      followingCount: 50,
      verifications: [],
    },
    authType: "demo",
    sessionToken: "demo_token_" + Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })
}

function createEnhancedDemoResponse() {
  return NextResponse.json({
    success: true,
    user: {
      fid: 54321,
      username: "warpcast_demo",
      displayName: "Warpcast Demo User",
      pfpUrl: "/placeholder-user.jpg",
      bio: "Enhanced demo user detected from Warpcast context",
      followerCount: 500,
      followingCount: 200,
      verifications: ["demo.eth"],
    },
    authType: "demo",
    sessionToken: "warpcast_demo_token_" + Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })
}
