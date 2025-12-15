import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { playlist_id, play_button_id, timeout_minutes } = await request.json();
    
    if (!playlist_id || !play_button_id || timeout_minutes === undefined) {
      return NextResponse.json({ error: 'Playlist ID, Play Button ID, and timeout minutes are required' }, { status: 400 });
    }

    if (timeout_minutes < 1 || timeout_minutes > 1000) {
      return NextResponse.json({ error: 'Timeout minutes must be between 1 and 1000' }, { status: 400 });
    }

    // Update the auto_advance_timeout for this specific card in the playlist
    await sql`
      UPDATE playlist_play_buttons
      SET auto_advance_timeout = ${timeout_minutes}
      WHERE playlist_id = ${playlist_id}
        AND play_button_id = ${play_button_id}
        AND user_fid = ${session.user.fid};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating auto-advance timeout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
