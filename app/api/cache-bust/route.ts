import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const fidStr = request.headers.get('x-user-fid');
    
    if (!fidStr) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }
    
    const fid = Number(fidStr);
    
    // Force a fresh connection and query
    const timestamp = new Date().toISOString();
    console.log(`🔄 Cache bust at ${timestamp} for FID: ${fid}`);
    
    // Count records with a fresh query
    const { rows: countRows } = await sql`
      SELECT COUNT(*) as count 
      FROM play_buttons 
      WHERE user_fid = ${fid};
    `;
    
    // Get actual records with a fresh query
    const { rows: dataRows } = await sql`
      SELECT id, (data->>'title') as title, (data->>'createdAt') as created_at
      FROM play_buttons 
      WHERE user_fid = ${fid}
      ORDER BY id;
    `;
    
    const response = NextResponse.json({
      timestamp,
      fid,
      count: countRows[0]?.count || 0,
      records: dataRows.length,
      data: dataRows
    });
    
    // Force no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Cache bust error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}