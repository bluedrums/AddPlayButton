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

    // Fetch the user's play buttons to return with the session
    const { rows } = await sql`SELECT data FROM play_buttons WHERE user_fid = ${user.fid};`;
    const playButtons = rows.map(row => row.data);

    const response = NextResponse.json({ success: true, user, playButtons });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // allow cross-site iframe requests
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
