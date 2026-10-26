import { type NextRequest, NextResponse } from 'next/server';
import { getNotificationTokens, sendNotification, hasNotificationsEnabled } from '@/lib/neynar';

/**
 * GET /api/notifications/test
 *
 * Reports whether Neynar notifications are configured.
 * Never returns API key material or notification token URLs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const testFid = searchParams.get('fid');

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    neynarApiKeySet: Boolean(process.env.NEYNAR_API_KEY),
  };

  try {
    if (action === 'status' || action === 'all') {
      // Check API key
      if (!process.env.NEYNAR_API_KEY) {
        results.error = 'NEYNAR_API_KEY is not configured';
        return NextResponse.json(results, { status: 500 });
      }

      // Try to fetch notification tokens
      const tokensResult = await getNotificationTokens({ limit: 10 });
      results.getNotificationTokens = {
        success: tokensResult.success,
        tokenCount: tokensResult.tokens?.length ?? 0,
        error: tokensResult.error,
      };

      // If a specific FID is provided, check their notification status
      if (testFid) {
        const fidNum = parseInt(testFid, 10);
        if (!isNaN(fidNum)) {
          const hasNotifications = await hasNotificationsEnabled(fidNum);
          results.fidNotificationStatus = {
            fid: fidNum,
            notificationsEnabled: hasNotifications,
          };
        }
      }
    }

    if (action === 'send-test') {
      // Send a test notification - either to specific FID or broadcast
      const targetFids = testFid ? [parseInt(testFid, 10)] : [];
      
      if (testFid && isNaN(parseInt(testFid, 10))) {
        return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
      }

      const sendResult = await sendNotification({
        title: '🎵 Test Notification',
        body: 'Add Play Button notifications are working!',
        targetUrl: 'https://addplaybutton.xyz',
        targetFids,
        notificationId: `test-${Date.now()}`,
      });

      results.sendNotification = sendResult;
      results.targetFids = targetFids.length > 0 ? targetFids : 'all users with notifications enabled';
    }

    // Add webhook config info
    results.webhookUrl = 'https://api.neynar.com/f/app/f28fb5dc-a10c-4a92-914d-4e435ec07db1/event';
    results.configuredIn = 'public/.well-known/farcaster.json';

    return NextResponse.json(results);
  } catch (error) {
    console.error('Notification test error:', error);
    return NextResponse.json({
      ...results,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

