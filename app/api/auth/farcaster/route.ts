import { type NextRequest, NextResponse } from "next/server"

// Farcaster auth verification endpoint
export async function POST(request: NextRequest) {
  try {
    const { message, signature, nonce, domain, fid } = await request.json()

    console.log("🔐 Farcaster Auth Request:", {
      hasWarpcastKey: !!process.env.WARPCAST_API_KEY,
      messageLength: message?.length,
      signaturePrefix: signature?.substring(0, 10),
      nonce,
      domain,
      fid,
    })

    // If we don't have a Warpcast API key, return mock data
    if (!process.env.WARPCAST_API_KEY) {
      console.log("🎭 Using mock authentication (no API key)")
      return NextResponse.json({
        success: true,
        user: {
          fid: fid || 1234,
          username: "demo",
          displayName: "Demo User",
          pfpUrl: "/placeholder.svg?height=64&width=64",
          custodyAddress: "0xDEMO",
          verifications: [],
        },
      })
    }

    console.log("🚀 Using real Farcaster authentication")

    // Verify the signature with Warpcast
    console.log("📡 Verifying signature with Warpcast...")
    const verificationResponse = await fetch("https://api.warpcast.com/v2/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
      },
      body: JSON.stringify({
        message,
        signature,
        nonce,
        domain,
      }),
    })

    console.log("📡 Warpcast verification response:", {
      status: verificationResponse.status,
      statusText: verificationResponse.statusText,
      ok: verificationResponse.ok,
    })

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text()
      console.error("❌ Warpcast verification failed:", errorText)
      throw new Error(`Warpcast verification failed: ${verificationResponse.status} ${errorText}`)
    }

    const verificationData = await verificationResponse.json()
    console.log("✅ Warpcast verification data:", verificationData)

    if (!verificationData.success) {
      console.error("❌ Invalid signature according to Warpcast")
      throw new Error("Invalid Farcaster signature")
    }

    // Get user profile from Farcaster
    const userFid = verificationData.fid || fid
    console.log(`👤 Fetching user profile for FID: ${userFid}`)

    const profileResponse = await fetch(`https://api.warpcast.com/v2/user?fid=${userFid}`, {
      headers: {
        Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
      },
    })

    console.log("👤 Profile fetch response:", {
      status: profileResponse.status,
      statusText: profileResponse.statusText,
      ok: profileResponse.ok,
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error("❌ Profile fetch failed:", errorText)
      throw new Error(`Failed to fetch user profile: ${profileResponse.status} ${errorText}`)
    }

    const profileData = await profileResponse.json()
    console.log("✅ User profile data:", {
      fid: profileData.result?.user?.fid,
      username: profileData.result?.user?.username,
      displayName: profileData.result?.user?.displayName,
    })

    const user = {
      fid: userFid,
      username: profileData.result.user.username,
      displayName: profileData.result.user.displayName,
      pfpUrl: profileData.result.user.pfp?.url,
      custodyAddress: profileData.result.user.custodyAddress,
      verifications: profileData.result.user.verifications || [],
    }

    console.log("🎉 Authentication successful for user:", user.username)
    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error("🚨 Farcaster auth error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Authentication failed",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 400 },
    )
  }
}
