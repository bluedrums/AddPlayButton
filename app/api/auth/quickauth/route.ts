import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, domain, userAgent, referrer } = body

    console.log("🔐 QuickAuth Request:", {
      action,
      domain,
      hasWarpcastKey: !!process.env.WARPCAST_API_KEY,
      userAgent: userAgent?.substring(0, 50) + "...",
      referrer,
    })

    if (action === "auto_auth" || action === "request_auth") {
      // Check if we have the real Warpcast API key
      if (!process.env.WARPCAST_API_KEY) {
        console.log("🎭 No WARPCAST_API_KEY - using demo mode")
        return NextResponse.json({
          success: true,
          user: {
            fid: 12345,
            username: "demo_user",
            displayName: "Demo User",
            pfpUrl: "/placeholder-user.jpg",
            bio: "Demo user for testing",
            followerCount: 100,
            followingCount: 50,
            verifications: [],
          },
          sessionToken: "demo_token_" + Date.now(),
          isDemo: true,
        })
      }

      console.log("🚀 Using real Warpcast API with WARPCAST_API_KEY")

      try {
        // Check for Farcaster frame context
        const isInFrame =
          referrer?.includes("warpcast.com") ||
          userAgent?.includes("farcaster") ||
          request.headers.get("x-farcaster-frame") === "true"

        console.log("🖼️ Frame context:", {
          isInFrame,
          referrer,
          hasFrameHeader: !!request.headers.get("x-farcaster-frame"),
        })

        // Try to get user from frame context or headers
        let userFid = null
        let userToken = null

        // Check for frame user data in headers
        const frameUserFid = request.headers.get("x-farcaster-user-fid")
        const frameUserToken = request.headers.get("x-farcaster-user-token")

        if (frameUserFid && frameUserToken) {
          userFid = Number.parseInt(frameUserFid)
          userToken = frameUserToken
          console.log("👤 Found frame user data:", { fid: userFid })
        }

        // If we have user context, validate with real Warpcast API
        if (userFid && userToken) {
          console.log("📡 Validating user with real Warpcast API...")

          try {
            const userResponse = await fetch(`https://api.warpcast.com/v2/user?fid=${userFid}`, {
              headers: {
                Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
                "Content-Type": "application/json",
              },
            })

            if (userResponse.ok) {
              const userData = await userResponse.json()
              console.log("✅ Real user validation successful:", userData.result?.user?.username)

              return NextResponse.json({
                success: true,
                user: {
                  fid: userData.result.user.fid,
                  username: userData.result.user.username,
                  displayName: userData.result.user.displayName,
                  pfpUrl: userData.result.user.pfp?.url || "/placeholder-user.jpg",
                  bio: userData.result.user.profile?.bio?.text,
                  followerCount: userData.result.user.followerCount,
                  followingCount: userData.result.user.followingCount,
                  verifications: userData.result.user.verifications || [],
                },
                sessionToken: userToken,
                isDemo: false,
              })
            } else {
              console.log("❌ User validation failed:", userResponse.status, await userResponse.text())
            }
          } catch (apiError) {
            console.error("❌ Warpcast API error:", apiError)
          }
        }

        // Try to get current user from Warpcast API using the API key
        console.log("🔄 Attempting to get current user from Warpcast API...")

        try {
          // First, try to get the current authenticated user
          const meResponse = await fetch("https://api.warpcast.com/v2/me", {
            headers: {
              Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
              "Content-Type": "application/json",
            },
          })

          if (meResponse.ok) {
            const meData = await meResponse.json()
            console.log("✅ Current user from API:", meData.result?.user?.username)

            return NextResponse.json({
              success: true,
              user: {
                fid: meData.result.user.fid,
                username: meData.result.user.username,
                displayName: meData.result.user.displayName,
                pfpUrl: meData.result.user.pfp?.url || "/placeholder-user.jpg",
                bio: meData.result.user.profile?.bio?.text,
                followerCount: meData.result.user.followerCount,
                followingCount: meData.result.user.followingCount,
                verifications: meData.result.user.verifications || [],
              },
              sessionToken: "warpcast_api_token_" + Date.now(),
              isDemo: false,
            })
          } else {
            console.log("❌ /me endpoint failed:", meResponse.status, await meResponse.text())
          }
        } catch (apiError) {
          console.error("❌ Warpcast /me API error:", apiError)
        }

        // If we're in a Warpcast context but API calls failed, try QuickAuth
        if (isInFrame) {
          console.log("🔄 In Warpcast frame - attempting QuickAuth...")

          try {
            // Use the QuickAuth endpoint with the real API key
            const quickAuthResponse = await fetch("https://api.warpcast.com/v2/auth", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                method: "quickauth",
                params: {
                  domain: domain,
                  siweUri: `https://${domain}`,
                  nonce: Date.now().toString(),
                },
              }),
            })

            if (quickAuthResponse.ok) {
              const quickAuthData = await quickAuthResponse.json()
              console.log("✅ QuickAuth successful")

              // If QuickAuth returns user data directly
              if (quickAuthData.result?.user) {
                return NextResponse.json({
                  success: true,
                  user: {
                    fid: quickAuthData.result.user.fid,
                    username: quickAuthData.result.user.username,
                    displayName: quickAuthData.result.user.displayName,
                    pfpUrl: quickAuthData.result.user.pfp?.url || "/placeholder-user.jpg",
                    bio: quickAuthData.result.user.profile?.bio?.text,
                    followerCount: quickAuthData.result.user.followerCount,
                    followingCount: quickAuthData.result.user.followingCount,
                    verifications: quickAuthData.result.user.verifications || [],
                  },
                  sessionToken: quickAuthData.result.token || "quickauth_token_" + Date.now(),
                  isDemo: false,
                })
              }
            } else {
              console.log("❌ QuickAuth failed:", quickAuthResponse.status, await quickAuthResponse.text())
            }
          } catch (quickAuthError) {
            console.error("❌ QuickAuth error:", quickAuthError)
          }
        }

        // If all real API attempts failed, fall back to demo mode
        console.log("🎭 All real API attempts failed - using demo mode")
        return NextResponse.json({
          success: true,
          user: {
            fid: 12345,
            username: "demo_user",
            displayName: "Demo User (Real API Failed)",
            pfpUrl: "/placeholder-user.jpg",
            bio: "Demo mode - Real Warpcast API calls failed",
            followerCount: 100,
            followingCount: 50,
            verifications: [],
          },
          sessionToken: "demo_token_" + Date.now(),
          isDemo: true,
        })
      } catch (error) {
        console.error("❌ QuickAuth implementation error:", error)

        // Final fallback to demo mode
        return NextResponse.json({
          success: true,
          user: {
            fid: 12345,
            username: "demo_user",
            displayName: "Demo User (Error)",
            pfpUrl: "/placeholder-user.jpg",
            bio: "Demo mode - Authentication error occurred",
            followerCount: 100,
            followingCount: 50,
            verifications: [],
          },
          sessionToken: "demo_token_" + Date.now(),
          isDemo: true,
        })
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("QuickAuth API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
