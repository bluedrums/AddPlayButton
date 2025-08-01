import { NextResponse, type NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET_KEY) {
      console.error('JWT_SECRET_KEY is not set in the environment variables.');
      return NextResponse.json({ error: 'Server configuration error: JWT secret is missing.' }, { status: 500 });
    }
    const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

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

    const token = await new SignJWT({ fid: user.fid })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const { rows } = await sql`SELECT data FROM play_buttons WHERE user_fid = ${user.fid};`;
    const playButtons = rows.map(row => row.data);

    const response = NextResponse.json({ success: true, user, playButtons });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
