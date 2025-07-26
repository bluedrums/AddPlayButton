import { NextResponse, type NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { sql } from '@vercel/postgres';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const user = await request.json();

    if (!user || !user.fid) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    // Save user to the database
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
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
