import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { playlist_id, play_button_id } = await request.json();
    if (!playlist_id || !play_button_id) {
      return NextResponse.json({ error: 'Playlist ID and Play Button ID are required' }, { status: 400 });
    }

    // Check if the playlist belongs to the user
    const { rows: playlistRows } = await sql`
      SELECT id FROM playlists WHERE id = ${playlist_id} AND user_fid = ${session.user.fid};
    `;
    if (playlistRows.length === 0) {
        return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 });
    }

    // Check if the play button belongs to the user
    const { rows: playButtonRows } = await sql`
        SELECT id FROM play_buttons WHERE id = ${play_button_id} AND user_fid = ${session.user.fid};
    `;
    if (playButtonRows.length === 0) {
        return NextResponse.json({ error: 'Play button not found or access denied' }, { status: 404 });
    }

    await sql`
      INSERT INTO playlist_play_buttons (playlist_id, play_button_id, user_fid)
      VALUES (${playlist_id}, ${play_button_id}, ${session.user.fid})
      ON CONFLICT (playlist_id, play_button_id, user_fid) DO NOTHING;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding play button to playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

