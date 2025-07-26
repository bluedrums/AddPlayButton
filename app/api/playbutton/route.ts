import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = searchParams.get('fid'); // Read from query param
    const id = searchParams.get('id');

    if (!fidStr || !id) {
      return NextResponse.json({ error: 'Missing fid or id' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT data FROM play_buttons WHERE user_fid = ${fid} AND id = ${id};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Play button not found' }, { status: 404 });
    }

    const playButton = rows[0].data;

    return NextResponse.json({ playButton });
  } catch (error) {
    console.error('Error in playbutton GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const fidStr = request.headers.get('x-user-fid'); // Read from header
    const body = await request.json();
    const { id, data } = body;

    if (!fidStr || !id || !data) {
      return NextResponse.json({ error: 'Missing fid, id, or data' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    await sql`
      INSERT INTO play_buttons (user_fid, id, data)
      VALUES (${fid}, ${id}, ${JSON.stringify(data)})
      ON CONFLICT (user_fid, id)
      DO UPDATE SET data = EXCLUDED.data;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playbutton POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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