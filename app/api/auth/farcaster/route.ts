import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { sql } from "@vercel/postgres"

// Farcaster auth verification endpoint
export async function POST(request: NextRequest) {
  console.log('--- /api/auth/farcaster: POST request received ---');
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

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { action, message, signature, nonce, domain, fid, username, displayName, pfpUrl, context } = body;
    console.log(`Auth action: ${action}, fid: ${fid}, username: ${username}`);

    // Handle mini-app authentication
    if (action === "miniapp-auth") {
      console.log("🔐 Mini-app authentication request for fid:", fid)
      console.log("📍 Request headers:", {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host')
      })
      
      if (!fid || !username) {
        return NextResponse.json(
          { success: false, error: "Missing required user data from mini-app context" },
          { status: 400 }
        )
      }

      // Create user data from mini-app context
      const user = {
        fid,
        username,
        displayName: displayName || username,
        pfpUrl: pfpUrl || null,
        custodyAddress: context?.user?.custodyAddress || null,
        verifications: context?.user?.verifications || [],
      }

      // Create JWT token
      const token = await new SignJWT({ fid: user.fid })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(JWT_SECRET)

      // Store user in database
      try {
        console.log(`Attempting to save user ${fid} to database...`);
        await sql`
          INSERT INTO users (fid, username, display_name, pfp_url, custody_address, verifications)
          VALUES (${user.fid}, ${user.username}, ${user.displayName}, ${user.pfpUrl}, ${user.custodyAddress}, ${JSON.stringify(user.verifications || [])})
          ON CONFLICT (fid)
          DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            pfp_url = EXCLUDED.pfp_url,
            custody_address = EXCLUDED.custody_address,
            verifications = EXCLUDED.verifications;
        `;
        console.log(`User ${fid} saved to database.`);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json({ success: false, error: "Database error: " + (dbError instanceof Error ? dbError.message : String(dbError)) }, { status: 500 });
      }
      
      const response = NextResponse.json({ success: true, user })
      response.cookies.set("session", token, {
        httpOnly: true,
        secure: true, // Always true for iframe context
        sameSite: "none", // Required for cross-site iframe context
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      
      console.log("🍪 Session cookie set with token:", token.substring(0, 20) + "...")
      console.log("🍪 Cookie settings:", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        domain: response.headers.get('set-cookie')
      })
      
      return response
    }

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
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: `Internal server error: ${errorMsg}` }, { status: 500 })
  }
}
