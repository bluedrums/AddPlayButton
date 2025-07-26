import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@vercel/postgres';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false, user: null });
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    const fid = payload.fid as number;

    if (!fid) {
      throw new Error('Invalid token payload');
    }

    const { rows } = await sql`SELECT * FROM users WHERE fid = ${fid};`;
    if (rows.length === 0) {
      return NextResponse.json({ isAuthenticated: false, user: null, error: 'User not found' });
    }

    return NextResponse.json({ isAuthenticated: true, user: rows[0] });
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.json({ isAuthenticated: false, user: null });
  }
}
