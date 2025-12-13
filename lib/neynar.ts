/**
 * Neynar API utilities for mini-app notifications
 * 
 * To use notifications:
 * 1. Set NEYNAR_API_KEY in your environment variables
 * 2. Update farcaster.json with your Neynar webhookUrl from dev.neynar.com
 */

const NEYNAR_API_BASE = 'https://api.neynar.com/v2';

interface NotificationPayload {
  /** Title of the notification (max 32 characters) */
  title: string;
  /** Body text of the notification (max 128 characters) */
  body: string;
  /** URL to open when notification is tapped */
  targetUrl: string;
  /** Unique identifier for this notification (for deduplication) */
  notificationId?: string;
}

interface NotificationFilters {
  /** Filter by FIDs that have followed specific FIDs */
  followedFids?: number[];
  /** Filter by FIDs that own tokens on specific chains */
  tokenOwnership?: {
    chainId: number;
    contractAddress: string;
  }[];
  /** Filter by FIDs with active power badge */
  hasPowerBadge?: boolean;
}

interface SendNotificationOptions extends NotificationPayload {
  /** Specific FIDs to target (empty array = all users with notifications enabled) */
  targetFids?: number[];
  /** Additional filters to apply */
  filters?: NotificationFilters;
}

interface NotificationResponse {
  success: boolean;
  deliveryStatus?: {
    totalTokens: number;
    tokensDelivered: number;
    tokensFailed: number;
  };
  error?: string;
}

/**
 * Send push notifications to mini-app users
 * 
 * @example
 * // Send to all users with notifications enabled
 * await sendNotification({
 *   title: "New feature!",
 *   body: "Check out our new playlist feature",
 *   targetUrl: "https://addplaybutton.xyz",
 * });
 * 
 * @example
 * // Send to specific users
 * await sendNotification({
 *   title: "Your playlist is ready",
 *   body: "Someone added to your shared playlist",
 *   targetUrl: "https://addplaybutton.xyz/playlists",
 *   targetFids: [12345, 67890],
 * });
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<NotificationResponse> {
  const apiKey = process.env.NEYNAR_API_KEY;
  
  if (!apiKey) {
    console.error('NEYNAR_API_KEY is not configured');
    return { success: false, error: 'NEYNAR_API_KEY not configured' };
  }

  const { title, body, targetUrl, notificationId, targetFids = [], filters } = options;

  // Validate title and body lengths
  if (title.length > 32) {
    return { success: false, error: 'Title must be 32 characters or less' };
  }
  if (body.length > 128) {
    return { success: false, error: 'Body must be 128 characters or less' };
  }

  try {
    const requestBody: Record<string, unknown> = {
      target_fids: targetFids,
      notification: {
        title,
        body,
        target_url: targetUrl,
        ...(notificationId && { notification_id: notificationId }),
      },
    };

    // Add filters if provided
    if (filters) {
      if (filters.followedFids?.length) {
        requestBody.filters = {
          ...requestBody.filters as object,
          followed_fids: filters.followedFids,
        };
      }
      if (filters.tokenOwnership?.length) {
        requestBody.filters = {
          ...requestBody.filters as object,
          token_ownership: filters.tokenOwnership.map(t => ({
            chain_id: t.chainId,
            contract_address: t.contractAddress,
          })),
        };
      }
      if (filters.hasPowerBadge !== undefined) {
        requestBody.filters = {
          ...requestBody.filters as object,
          has_power_badge: filters.hasPowerBadge,
        };
      }
    }

    const response = await fetch(`${NEYNAR_API_BASE}/farcaster/frame/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Neynar notification error:', response.status, errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      deliveryStatus: {
        totalTokens: data.total_tokens || 0,
        tokensDelivered: data.tokens_delivered || 0,
        tokensFailed: data.tokens_failed || 0,
      },
    };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch list of notification tokens for the mini-app
 * Useful for checking how many users have notifications enabled
 */
export async function getNotificationTokens(options?: {
  fids?: number[];
  cursor?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  tokens?: Array<{
    fid: number;
    createdAt: string;
  }>;
  nextCursor?: string;
  error?: string;
}> {
  const apiKey = process.env.NEYNAR_API_KEY;
  
  if (!apiKey) {
    console.error('NEYNAR_API_KEY is not configured');
    return { success: false, error: 'NEYNAR_API_KEY not configured' };
  }

  try {
    const params = new URLSearchParams();
    if (options?.fids?.length) {
      params.set('fids', options.fids.join(','));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }

    const url = `${NEYNAR_API_BASE}/farcaster/frame/notification/tokens${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Neynar get tokens error:', response.status, errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      tokens: data.tokens?.map((t: { fid: number; created_at: string }) => ({
        fid: t.fid,
        createdAt: t.created_at,
      })) || [],
      nextCursor: data.next?.cursor,
    };
  } catch (error) {
    console.error('Failed to fetch notification tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a specific user has notifications enabled
 */
export async function hasNotificationsEnabled(fid: number): Promise<boolean> {
  const result = await getNotificationTokens({ fids: [fid], limit: 1 });
  return result.success && (result.tokens?.length ?? 0) > 0;
}
