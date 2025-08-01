import { NextResponse, type NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  console.log('--- /api/auth/session: POST request received ---');
  try {
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    const POSTGRES_URL = process.env.POSTGRES_URL;

    if (!JWT_SECRET_KEY || !POSTGRES_URL) {
      const missing = [];
      if (!JWT_SECRET_KEY) missing.push('JWT_SECRET_KEY');
      if (!POSTGRES_URL) missing.push('POSTGRES_URL');
      console.error(`🔴 Missing required environment variables: ${missing.join(', ')}`);
      return NextResponse.json({ error: `Server configuration error: Missing ${missing.join(', ')}` }, { status: 500 });
    }
    console.log('✅ Environment variables checked.');

    const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);
    const user = await request.json();
    console.log('👤 User data received from client:', user ? `fid: ${user.fid}` : 'No user data');

    if (!user || !user.fid) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    console.log(`💽 Attempting to INSERT/UPDATE user fid: ${user.fid} into database...`);
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
    console.log(`✅ User fid: ${user.fid} saved to database.`);

    console.log('🔐 Signing JWT...');
    const token = await new SignJWT({ fid: user.fid })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    console.log('✅ JWT signed.');

    console.log(`💽 Fetching play buttons for user fid: ${user.fid}...`);
    const { rows } = await sql`SELECT data FROM play_buttons WHERE user_fid = ${user.fid};`;
    const playButtons = rows.map(row => row.data);
    console.log(`✅ Found ${playButtons.length} play buttons.`);

    const response = NextResponse.json({ success: true, user, playButtons });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    console.log('🍪 Session cookie set. Sending response.');

    return response;
  } catch (error) {
    console.error('🔴 Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
