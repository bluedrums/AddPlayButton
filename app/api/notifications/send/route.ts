import { type NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/neynar';

/**
 * POST /api/notifications/send
 * 
 * Send push notifications to mini-app users via Neynar.
 * Requires authentication (user must be logged in).
 * 
 * Request body:
 * - title: string (required, max 32 chars)
 * - body: string (required, max 128 chars)
 * - targetUrl: string (required)
 * - targetFids?: number[] (optional, empty = all users with notifications enabled)
 * - notificationId?: string (optional, for deduplication)
 * - filters?: object (optional filtering options)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user FID from middleware
    const userFid = request.headers.get('x-user-fid');
    
    if (!userFid) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { title, body: notificationBody, targetUrl, targetFids, notificationId, filters } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'title is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!notificationBody || typeof notificationBody !== 'string') {
      return NextResponse.json(
        { error: 'body is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json(
        { error: 'targetUrl is required and must be a string' },
        { status: 400 }
      );
    }

    // Send the notification via Neynar
    const result = await sendNotification({
      title,
      body: notificationBody,
      targetUrl,
      targetFids: targetFids || [],
      notificationId,
      filters,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deliveryStatus: result.deliveryStatus,
    });
  } catch (error) {
    console.error('Notification send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
