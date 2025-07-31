import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { sql } from "@vercel/postgres"
import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)

// Farcaster auth verification endpoint
export async function POST(request: NextRequest) {
  try {
    const { message, signature, fid, username, displayName, pfpUrl, custodyAddress, verifications } = await request.json()

    if (!process.env.NEYNAR_API_KEY) {
      throw new Error("NEYNAR_API_KEY is not set")
    }

    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

    const { is_valid } = await client.validateFrameSignature({
      message_bytes_in_hex: message,
      signature_in_hex: signature,
    });

    if (!is_valid) {
      throw new Error("Invalid Farcaster signature")
    }
    
    const user = {
      fid,
      username,
      displayName,
      pfpUrl,
      custodyAddress,
      verifications,
    }

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
      secure: true,
      sameSite: 'none', // allow cross-site iframe requests
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Auth API error:", error)
    if (isApiErrorResponse(error)) {
      return NextResponse.json({ ...error.response.data }, { status: error.response.status })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
