import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@vercel/postgres';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function GET(request: NextRequest) {
  console.log('🔍 Status check: Checking authentication status...');
  const sessionCookie = request.cookies.get('session');
  console.log('🍪 Status check: Session cookie present:', !!sessionCookie);

  if (!sessionCookie) {
    console.log('❌ Status check: No session cookie found');
    return NextResponse.json({ isAuthenticated: false, user: null });
  }

  try {
    console.log('🔐 Status check: Verifying JWT...');
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    const fid = payload.fid as number;

    if (!fid) {
      console.log('❌ Status check: Invalid token payload');
      throw new Error('Invalid token payload');
    }

    console.log(`✅ Status check: Token valid for FID ${fid}`);
    const { rows } = await sql`SELECT * FROM users WHERE fid = ${fid};`;
    if (rows.length === 0) {
      console.log('❌ Status check: User not found in database');
      return NextResponse.json({ isAuthenticated: false, user: null, error: 'User not found' });
    }

    console.log('✅ Status check: User authenticated:', rows[0].username);
    return NextResponse.json({ isAuthenticated: true, user: rows[0] });
  } catch (error) {
    console.error('❌ Status check: Session verification failed:', error);
    return NextResponse.json({ isAuthenticated: false, user: null });
  }
}
