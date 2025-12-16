import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = request.headers.get('x-user-fid');
    const id = searchParams.get('id');

    console.log(`playbutton GET: fid from header: ${fidStr}, id from query: ${id}`);

    if (!id) {
      return NextResponse.json({ error: 'Missing resource ID' }, { status: 400 });
    }

    let rows: { data: unknown }[] = [];
    
    // Try fetching with user_fid first when provided
    if (fidStr) {
      const fid = Number(fidStr);
      if (!isNaN(fid)) {
        rows = (await sql`
          SELECT data FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
        `).rows;
      }
    }

    // Fallback to lookup by id only (public share) when header missing or nothing found
    if (rows.length === 0) {
      console.log(`Falling back to ID-only lookup for id: ${id}`);
      rows = (await sql`
        SELECT data FROM play_buttons WHERE id = ${id} LIMIT 1;
      `).rows;
    }

    if (rows.length === 0) {
      console.log(`No play button found for id: ${id}`);
      return NextResponse.json({ error: 'Play button not found' }, { status: 404 });
    }

    const playButton = rows[0].data;
    console.log('Returning playButton data:', playButton);

    return NextResponse.json(playButton);
  } catch (error) {
    console.error('Error in playbutton GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('Received POST /api/playbutton request');
  try {
    const fidStr = request.headers.get('x-user-fid');
    const body = await request.json();
    const { id, data } = body;

    console.log('Playbutton POST details:', { fidStr, id, hasData: !!data });

    if (!fidStr || !id || !data) {
      console.log('Validation failed: Missing fid, id, or data.');
      return NextResponse.json({ error: 'Missing fid, id, or data' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      console.log('Validation failed: Invalid fid.');
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    console.log(`Attempting to write to play_buttons for fid: ${fid}, id: ${id}`);
    await sql`
      INSERT INTO play_buttons (user_fid, id, data)
      VALUES (${fid}, ${id}, ${JSON.stringify(data)})
      ON CONFLICT (user_fid, id)
      DO UPDATE SET data = EXCLUDED.data;
    `;
    console.log('Successfully wrote to play_buttons.');

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in playbutton POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  console.log('Received DELETE /api/playbutton request');
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = request.headers.get('x-user-fid');
    const id = searchParams.get('id');
    console.log('🗑️ DELETE request - FID:', fidStr, 'ID:', id);
    console.log('🔍 ID type:', typeof id, 'ID length:', id?.length);

    if (!fidStr || !id) {
      console.error('❌ Missing FID or ID');
      return NextResponse.json({ error: 'Missing fid or id' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      console.error('❌ Invalid FID:', fidStr);
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    console.log('📋 Deleting play button - FID:', fid, 'ID:', id);
    
    // First, check if the record exists
    const { rows: checkRows } = await sql`
      SELECT id, user_fid FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
    `;
    console.log('🔍 Found records before delete:', checkRows.length, checkRows);
    
    if (checkRows.length === 0) {
      console.error('❌ No record found to delete!');
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    // Now delete the record
    const result = await sql`
      DELETE FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
    `;
    console.log('✅ Delete result:', result);
    console.log('📊 Rows affected:', result.rowCount);
    
    // Verify deletion
    const { rows: verifyRows } = await sql`
      SELECT id FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
    `;
    console.log('🔍 Records after delete:', verifyRows.length);
    
    if (verifyRows.length > 0) {
      console.error('❌ Record still exists after delete!');
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: result.rowCount });
  } catch (error) {
    console.error('Error in playbutton DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
