import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 QuickAuth API called")

    // Get headers that might contain Farcaster context
    const headers = request.headers
    const userAgent = headers.get("user-agent") || ""
    const referer = headers.get("referer") || ""
    const farcasterFrame = headers.get("x-farcaster-frame")
    const farcasterUserFid = headers.get("x-farcaster-user-fid")
    const farcasterUserToken = headers.get("x-farcaster-user-token")

    console.log("📋 Request context:", {
      userAgent: userAgent.substring(0, 50),
      referer: referer.substring(0, 50),
      farcasterFrame,
      farcasterUserFid,
      hasApiKey: !!process.env.WARPCAST_API_KEY,
    })

    // Check if we have real Farcaster context
    const hasRealContext = farcasterUserFid || referer.includes("warpcast.com") || userAgent.includes("Warpcast")

    if (hasRealContext && process.env.WARPCAST_API_KEY) {
      console.log("🎯 Attempting real Farcaster authentication")

      try {
        // Try to get user info from Warpcast API
        let userData = null

        if (farcasterUserFid) {
          // Get user by FID
          const userResponse = await fetch(`https://api.warpcast.com/v2/user?fid=${farcasterUserFid}`, {
            headers: {
              Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
              "Content-Type": "application/json",
            },
          })

          if (userResponse.ok) {
            const userResult = await userResponse.json()
            userData = userResult.result?.user
            console.log("✅ Got user data from FID:", userData?.username)
          }
        }

        if (!userData) {
          // Try to get current user with /me endpoint
          const meResponse = await fetch("https://api.warpcast.com/v2/me", {
            headers: {
              Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
              "Content-Type": "application/json",
            },
          })

          if (meResponse.ok) {
            const meResult = await meResponse.json()
            userData = meResult.result?.user
            console.log("✅ Got user data from /me:", userData?.username)
          }
        }

        if (userData) {
          const authData = {
            user: {
              fid: userData.fid,
              username: userData.username,
              displayName: userData.displayName || userData.username,
              pfpUrl: userData.pfp?.url,
              bio: userData.profile?.bio?.text,
              followerCount: userData.followerCount || 0,
              followingCount: userData.followingCount || 0,
              verifications: userData.verifications || [],
            },
            authType: "real",
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          }

          console.log("🎉 Real authentication successful")
          return NextResponse.json({ success: true, ...authData })
        }
      } catch (apiError) {
        console.error("❌ Warpcast API error:", apiError)
      }
    }

    // Fallback to demo mode
    console.log("🎭 Falling back to demo mode")
    const demoUser = {
      fid: 12345,
      username: "demo_user",
      displayName: "Demo User",
      pfpUrl: "/placeholder-user.jpg",
      bio: "This is a demo account for testing the Add Play Button mini app.",
      followerCount: 1234,
      followingCount: 567,
      verifications: [],
    }

    const authData = {
      user: demoUser,
      authType: "demo",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }

    return NextResponse.json({ success: true, ...authData })
  } catch (error) {
    console.error("❌ QuickAuth error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
