import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getIronSession(request, new Response(), sessionOptions);
    const fidStr = request.headers.get('x-user-fid');

    if (!fidStr) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT * FROM users WHERE fid = ${fid};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in me GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
