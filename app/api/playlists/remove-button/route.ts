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

    // Get the order_index of the item being removed
    const { rows: removedItem } = await sql`
      SELECT order_index
      FROM playlist_play_buttons
      WHERE playlist_id = ${playlist_id}
        AND play_button_id = ${play_button_id}
        AND user_fid = ${session.user.fid};
    `;

    // Delete the item
    await sql`
      DELETE FROM playlist_play_buttons
      WHERE playlist_id = ${playlist_id}
        AND play_button_id = ${play_button_id}
        AND user_fid = ${session.user.fid};
    `;

    // Re-index remaining items to maintain sequential order
    if (removedItem.length > 0) {
      await sql`
        UPDATE playlist_play_buttons
        SET order_index = order_index - 1
        WHERE playlist_id = ${playlist_id}
          AND user_fid = ${session.user.fid}
          AND order_index > ${removedItem[0].order_index};
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing play button from playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

