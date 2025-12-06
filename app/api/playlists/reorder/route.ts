import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { playlist_id, play_button_id, direction } = await request.json();
    
    if (!playlist_id || !play_button_id || !direction) {
      return NextResponse.json({ error: 'Playlist ID, Play Button ID, and direction are required' }, { status: 400 });
    }

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json({ error: 'Direction must be "up" or "down"' }, { status: 400 });
    }

    // Get all items in the playlist ordered by order_index
    const { rows: items } = await sql`
      SELECT play_button_id, order_index
      FROM playlist_play_buttons
      WHERE playlist_id = ${playlist_id} AND user_fid = ${session.user.fid}
      ORDER BY order_index ASC;
    `;

    if (items.length < 2) {
      return NextResponse.json({ error: 'Cannot reorder: playlist has less than 2 items' }, { status: 400 });
    }

    // Find the current item's index
    const currentIndex = items.findIndex(item => item.play_button_id === play_button_id);
    
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Play button not found in playlist' }, { status: 404 });
    }

    // Determine the target index
    let targetIndex: number;
    if (direction === 'up') {
      if (currentIndex === 0) {
        return NextResponse.json({ error: 'Already at the top' }, { status: 400 });
      }
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex === items.length - 1) {
        return NextResponse.json({ error: 'Already at the bottom' }, { status: 400 });
      }
      targetIndex = currentIndex + 1;
    }

    // Swap the order_index values between the two items
    const currentOrderIndex = items[currentIndex].order_index;
    const targetOrderIndex = items[targetIndex].order_index;
    
    // Update both items with swapped order_index values
    await sql`
      UPDATE playlist_play_buttons
      SET order_index = CASE 
        WHEN play_button_id = ${play_button_id} THEN ${targetOrderIndex}
        WHEN play_button_id = ${items[targetIndex].play_button_id} THEN ${currentOrderIndex}
      END
      WHERE playlist_id = ${playlist_id}
        AND play_button_id IN (${play_button_id}, ${items[targetIndex].play_button_id})
        AND user_fid = ${session.user.fid};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

