import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from Quick Auth
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization token" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Validate the token with Farcaster API
    const response = await fetch("https://api.warpcast.com/v2/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userData = await response.json()

    // Return user data
    return NextResponse.json({
      fid: userData.result.user.fid,
      username: userData.result.user.username,
      displayName: userData.result.user.displayName,
      pfpUrl: userData.result.user.pfp?.url,
      bio: userData.result.user.profile?.bio?.text,
      followerCount: userData.result.user.followerCount,
      followingCount: userData.result.user.followingCount,
      verifications: userData.result.user.verifications || [],
    })
  } catch (error) {
    console.error("Sign in API error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
