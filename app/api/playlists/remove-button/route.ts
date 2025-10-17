import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { playlist_id, play_button_id } = await request.json();
    if (!playlist_id || !play_button_id) {
      return NextResponse.json({ error: 'Playlist ID and Play Button ID are required' }, { status: 400 });
    }

    await sql`
      DELETE FROM playlist_play_buttons
      WHERE playlist_id = ${playlist_id}
        AND play_button_id = ${play_button_id}
        AND user_fid = ${session.user.fid};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing play button from playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

