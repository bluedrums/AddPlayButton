import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { sql } from '@vercel/postgres';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function verifySession(cookieValue?: string) {
  if (!cookieValue) {
    return { isAuthenticated: false, user: null } as const;
  }

  try {
    const { payload } = await jwtVerify(cookieValue, JWT_SECRET);
    const fid = payload.fid as number;

    if (!fid) {
      throw new Error('Invalid token payload');
    }

    const { rows } = await sql`SELECT * FROM users WHERE fid = ${fid};`;
    if (rows.length === 0) {
      return { isAuthenticated: false, user: null } as const;
    }

    const user = {
      fid: rows[0].fid,
      username: rows[0].username,
      displayName: rows[0].display_name,
      pfpUrl: rows[0].pfp_url,
      custodyAddress: rows[0].custody_address,
      verifications: rows[0].verifications || [],
    };

    return { isAuthenticated: true, user } as const;
  } catch (error) {
    console.error('Session verification failed:', error);
    return { isAuthenticated: false, user: null } as const;
  }
}

export async function getSession() {
  const sessionCookie = cookies().get('session');
  return verifySession(sessionCookie?.value);
}
