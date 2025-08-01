import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { sql } from "@vercel/postgres"

// Farcaster auth verification endpoint
export async function POST(request: NextRequest) {
  try {
    const { WARPCAST_API_KEY, JWT_SECRET_KEY } = process.env;
    if (!WARPCAST_API_KEY || !JWT_SECRET_KEY) {
      const missing = [];
      if (!WARPCAST_API_KEY) missing.push('WARPCAST_API_KEY');
      if (!JWT_SECRET_KEY) missing.push('JWT_SECRET_KEY');
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      return NextResponse.json({ error: `Server configuration error: Missing ${missing.join(', ')}` }, { status: 500 });
    }
    const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

    const body = await request.json()
    const { action, message, signature, nonce, domain, fid } = body

    if (action === "verify") {
      const verificationResponse = await fetch("https://api.warpcast.com/v2/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WARPCAST_API_KEY}`,
        },
        body: JSON.stringify({ message, signature, nonce, domain }),
      })

      if (!verificationResponse.ok) {
        const errorText = await verificationResponse.text()
        console.error("Warpcast verification failed:", errorText)
        throw new Error(`Warpcast verification failed: ${verificationResponse.status} ${errorText}`)
      }

      const verificationData = await verificationResponse.json()
      if (!verificationData.success) {
        console.error("Invalid signature according to Warpcast")
        throw new Error("Invalid Farcaster signature")
      }

      const userFid = verificationData.fid || fid
      const profileResponse = await fetch(`https://api.warpcast.com/v2/user?fid=${userFid}`, {
        headers: { Authorization: `Bearer ${WARPCAST_API_KEY}` },
      })

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text()
        console.error("Profile fetch failed:", errorText)
        throw new Error(`Failed to fetch user profile: ${profileResponse.status} ${errorText}`)
      }

      const profileData = await profileResponse.json()
      const user = {
        fid: userFid,
        username: profileData.result.user.username,
        displayName: profileData.result.user.displayName,
        pfpUrl: profileData.result.user.pfp?.url,
        custodyAddress: profileData.result.user.custodyAddress,
        verifications: profileData.result.user.verifications || [],
      }

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

      const token = await new SignJWT({ fid: user.fid })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      const response = NextResponse.json({ success: true, user });
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Auth API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
