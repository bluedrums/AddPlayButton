import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  console.log('Received GET /api/playbutton/all request');
  try {
    const fidStr = request.headers.get('x-user-fid');
    console.log('🔍 FID from header:', fidStr);

    if (!fidStr) {
      console.error('❌ Missing FID in request');
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      console.error('❌ Invalid FID:', fidStr);
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    console.log('📋 Fetching play buttons for FID:', fid);
    const { rows } = await sql`
      SELECT data FROM play_buttons WHERE user_fid = ${fid} ORDER BY (data->>'createdAt')::timestamptz DESC;
    `;
    console.log('📊 Database returned', rows.length, 'rows for FID:', fid);

    const playButtons = rows.map(row => row.data);

    const response = NextResponse.json(playButtons);
    // Add cache control headers to prevent any caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error in playbutton GET_ALL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
