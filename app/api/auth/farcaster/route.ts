import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { sql } from "@vercel/postgres"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)

// Farcaster auth verification endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, message, signature, nonce, domain, fid } = body

    if (action === "verify") {
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
            fid: fid || 12345,
            username: "demo_user",
            displayName: "Demo User",
            pfpUrl: "/placeholder-user.jpg",
            custodyAddress: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6",
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

      console.log(`💾 Saving user ${user.username} (FID: ${user.fid}) to database...`)
      await sql`
        INSERT INTO users (fid, username, display_name, pfp_url, custody_address, verifications)
        VALUES (${user.fid}, ${user.username}, ${user.displayName}, ${user.pfpUrl}, ${user.custodyAddress}, ${JSON.stringify(user.verifications)})
        ON CONFLICT (fid)
        DO UPDATE SET
          username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          pfp_url = EXCLUDED.pfp_url,
          custody_address = EXCLUDED.custody_address,
          verifications = EXCLUDED.verifications;
      `
      console.log(`✅ User ${user.username} saved to database.`)

      // Create a JWT session token
      const token = await new SignJWT({ fid: user.fid })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      const response = NextResponse.json({ success: true, user });
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax', // Use 'lax' for iframe compatibility
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Auth API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
