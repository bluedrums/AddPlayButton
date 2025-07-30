import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = request.headers.get('x-user-fid'); // Read from header
    const id = searchParams.get('id');

    if (!fidStr || !id) {
      return NextResponse.json({ error: 'Missing authentication token or resource ID' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT data FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Play button not found or access denied' }, { status: 404 });
    }

    const playButton = rows[0].data;

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
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = request.headers.get('x-user-fid');
    const id = searchParams.get('id');

    if (!fidStr || !id) {
      return NextResponse.json({ error: 'Missing fid or id' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    await sql`
      DELETE FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playbutton DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
