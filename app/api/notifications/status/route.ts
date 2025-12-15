import { type NextRequest, NextResponse } from 'next/server';
import { getNotificationTokens, hasNotificationsEnabled } from '@/lib/neynar';

/**
 * GET /api/notifications/status
 * 
 * Get notification status for the mini-app.
 * Can check a specific user's status or get overall token count.
 * 
 * Query params:
 * - fid?: number - Check if a specific user has notifications enabled
 * - limit?: number - Limit for pagination (default 100)
 * - cursor?: string - Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    // Get user FID from middleware
    const userFid = request.headers.get('x-user-fid');
    
    if (!userFid) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const limit = searchParams.get('limit');
    const cursor = searchParams.get('cursor');

    // If checking a specific FID
    if (fid) {
      const fidNum = parseInt(fid, 10);
      if (isNaN(fidNum)) {
        return NextResponse.json(
          { error: 'Invalid FID' },
          { status: 400 }
        );
      }
      
      const enabled = await hasNotificationsEnabled(fidNum);
      return NextResponse.json({
        fid: fidNum,
        notificationsEnabled: enabled,
      });
    }

    // Get list of notification tokens
    const result = await getNotificationTokens({
      limit: limit ? parseInt(limit, 10) : 100,
      cursor: cursor || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch notification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens: result.tokens,
      totalCount: result.tokens?.length || 0,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error('Notification status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
