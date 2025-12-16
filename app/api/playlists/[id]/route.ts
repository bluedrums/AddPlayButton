import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint to fetch a playlist by ID for share metadata generation.
 * This endpoint does not require authentication - it's used for generating
 * miniapp embed cards when a playlist is shared.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, route handler params are Promises
    const resolvedParams = await params;
    const playlistId = Number(resolvedParams.id);
    
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: 'Invalid playlist ID' }, { status: 400 });
    }

    const { rows: playlists } = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.user_fid,
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
                'createdAt', pb.data->>'createdAt',
                'autoAdvanceTimeout', COALESCE(ppb.auto_advance_timeout, 4)
              )
              ORDER BY ppb.order_index ASC
            )
            FROM playlist_play_buttons ppb
            JOIN play_buttons pb ON ppb.play_button_id = pb.id AND ppb.user_fid = pb.user_fid
            WHERE ppb.playlist_id = p.id
          ),
          '[]'::json
        ) as play_buttons
      FROM playlists p
      WHERE p.id = ${playlistId};
    `;

    if (playlists.length === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlists[0]);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
