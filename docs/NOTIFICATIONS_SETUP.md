# Neynar Notifications Setup Guide

This guide explains how to set up push notifications for your Farcaster mini-app using Neynar.

## Overview

Neynar provides a managed notification system for Farcaster mini-apps that:
- Automatically manages notification tokens (no need to store them yourself)
- Handles user opt-in/opt-out events
- Delivers notifications to all major Farcaster clients

## Setup Steps

### 1. Get Your Neynar API Key

1. Go to [dev.neynar.com](https://dev.neynar.com)
2. Create or select your app
3. Copy your API key

### 2. Find Your Neynar Webhook URL

1. In the Neynar dashboard, click on your app
2. Look for the "Frame Events Webhook URL" - it should look like:
   ```
   https://api.neynar.com/f/app/<your_client_id>/event
   ```
3. Copy this URL

### 3. Update farcaster.json

Edit `public/.well-known/farcaster.json` and update the `webhookUrl` field:

```json
{
  "frame": {
    // ... other fields ...
    "webhookUrl": "https://api.neynar.com/f/app/YOUR_CLIENT_ID_HERE/event"
  }
}
```

Replace `YOUR_CLIENT_ID_HERE` with your actual client ID from the Neynar dashboard.

### 4. Set Environment Variables

Add the following to your `.env.local`:

```env
NEYNAR_API_KEY=your_neynar_api_key_here
```

### 5. Deploy and Test

After deploying:
1. Users who add your mini-app will be prompted to enable notifications
2. When they enable notifications, Neynar stores their notification token
3. You can then send notifications using the API

## API Usage

### Send Notifications

**POST** `/api/notifications/send`

```typescript
// Send to all users with notifications enabled
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "New feature!", // max 32 chars
    body: "Check out our new playlist feature", // max 128 chars
    targetUrl: "https://addplaybutton.xyz",
  }),
});

// Send to specific users
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Your playlist is ready",
    body: "Someone added to your shared playlist",
    targetUrl: "https://addplaybutton.xyz/playlists",
    targetFids: [12345, 67890], // specific FIDs
  }),
});

// Send with filters
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Premium feature",
    body: "New features for token holders",
    targetUrl: "https://addplaybutton.xyz",
    filters: {
      hasPowerBadge: true, // only power badge holders
      tokenOwnership: [{
        chainId: 8453, // Base
        contractAddress: "0x..."
      }]
    }
  }),
});
```

### Check Notification Status

**GET** `/api/notifications/status`

```typescript
// Check if a specific user has notifications enabled
const response = await fetch('/api/notifications/status?fid=12345');
// Returns: { fid: 12345, notificationsEnabled: true }

// Get list of all notification tokens
const response = await fetch('/api/notifications/status');
// Returns: { success: true, tokens: [...], totalCount: 100, nextCursor: "..." }
```

## Using in Code

You can also use the Neynar functions directly in your server code:

```typescript
import { sendNotification, hasNotificationsEnabled } from '@/lib/neynar';

// Check if user has notifications
const canNotify = await hasNotificationsEnabled(userFid);

// Send notification
if (canNotify) {
  await sendNotification({
    title: "Hello!",
    body: "You have a new message",
    targetUrl: "https://addplaybutton.xyz",
    targetFids: [userFid],
  });
}
```

## Best Practices

1. **Title & Body Limits**: Title max 32 chars, body max 128 chars
2. **Notification ID**: Use `notificationId` to prevent duplicate notifications
3. **Target URL**: Always include a relevant deep link
4. **Frequency**: Don't spam - send meaningful notifications only
5. **Timing**: Consider user timezones when sending bulk notifications

## Troubleshooting

### Notifications not being received
- Verify `NEYNAR_API_KEY` is set correctly
- Check that `webhookUrl` in farcaster.json points to Neynar
- Ensure users have actually enabled notifications for your app
- Check Neynar dashboard for delivery status

### API returns 401
- User must be authenticated to send notifications
- Ensure session cookie or FID header is present

### "Title/body too long" error
- Title must be ≤32 characters
- Body must be ≤128 characters

## Resources

- [Neynar Notifications Docs](https://docs.neynar.com/docs/send-notifications-to-mini-app-users)
- [Neynar Dashboard](https://dev.neynar.com)
- [Farcaster Mini-App Docs](https://docs.farcaster.xyz/developers/frames/v2/notifications)
