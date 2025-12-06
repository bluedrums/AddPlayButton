import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = await verifySession(sessionCookie);
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { rows: playlists } = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pb.id,
                'url', pb.data->>'url',
                'platform', pb.data->>'platform',
                'title', pb.data->>'title',
                'artist', pb.data->>'artist',
                'embedUrl', pb.data->>'embedUrl',
                'coverImage', pb.data->>'coverImage',
                'createdAt', pb.data->>'createdAt'
              )
            )
            FROM playlist_play_buttons ppb
            JOIN play_buttons pb ON ppb.play_button_id = pb.id AND ppb.user_fid = pb.user_fid
            WHERE ppb.playlist_id = p.id
            ORDER BY ppb.order_index ASC
          ),
          '[]'::json
        ) as play_buttons
      FROM playlists p
      WHERE p.user_fid = ${session.user.fid}
      ORDER BY p.created_at DESC;
    `;
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = await verifySession(sessionCookie);
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.length > 255) {
      return NextResponse.json({ error: 'Invalid playlist name' }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO playlists (user_fid, name)
      VALUES (${session.user.fid}, ${name})
      RETURNING *;
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = await verifySession(sessionCookie);
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
  
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
      }
  
      await sql`
        DELETE FROM playlists
        WHERE id = ${Number(id)} AND user_fid = ${session.user.fid};
      `;
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

