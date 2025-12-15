# Vercel Production Deployment Verification Checklist

## ✅ Environment Variables Required

The following environment variables must be set in Vercel:

### Required Variables:
- `JWT_SECRET_KEY` - Required for authentication (used in proxy.ts and auth routes)
- `POSTGRES_URL` - Required for database connection (used in auth/session)
- `NEXT_PUBLIC_APP_URL` - Should be set to `https://addplaybutton.xyz` (has fallback)

### Optional Variables:
- `NEXT_PUBLIC_APP_DOMAIN` - Defaults to window.location.hostname if not set
- `NEXT_PUBLIC_USDC_ADDRESS` - For donation feature (has fallback)
- `NEXT_PUBLIC_BASE_PROJECT_ID` - For Base/OnchainKit integration
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - For OnchainKit wallet features
- `WARPCAST_API_KEY` - For fetching user casts (optional feature)
- `NEYNAR_API_KEY` - For push notifications feature (optional)

## ✅ Middleware Configuration

The middleware has been properly configured to:
1. Allow public access to `/api/playbutton` GET endpoint (exact match only)
2. Allow public access to `/api/metadata` GET endpoint  
3. Allow public access to `/api/oembed` GET endpoint
4. Note: `/api/playlists/[id]` GET is currently protected (not in publicRoutes), but route file indicates it should be public for share pages - verify this works correctly
5. Allow unauthenticated access to `/share/` pages
6. Use proper cookie settings with `sameSite: 'none'` for iframe contexts
7. CSRF protection enabled for state-changing methods (POST, PUT, DELETE) except exempt routes
8. Accepts Farcaster FID header as authentication alternative for mini-app contexts

## ✅ API Routes Verification

### Public Routes (No Auth Required):
- `/api/auth/farcaster` POST - For authentication (mini-app auth and signature verification)
- `/api/auth/session` GET, POST - For session management (middleware allows GET but route only implements POST)
- `/api/auth/status` GET - Check authentication status
- `/api/auth/csrf` GET - For CSRF token
- `/api/playbutton` GET - For fetching play button data on share pages (exact match only, `/all` requires auth; route handler accepts optional `x-user-fid` header but falls back to public lookup)
- `/api/metadata` GET - For fetching OG metadata from URLs
- `/api/oembed` GET - For fetching oEmbed data
- `/api/user/casts` GET - For fetching user casts
- `/api/env-check` GET - For environment variable checking

### Protected Routes (Require Authentication):
- `/api/playbutton` POST, DELETE - Create/delete play buttons
- `/api/playbutton/all` GET - Get all play buttons for authenticated user
- `/api/me` GET - Get current user info
- `/api/playlists` GET, POST, PATCH, DELETE - List, create, rename, delete playlists
- `/api/playlists/[id]` GET - Get playlist by ID (currently protected, but route file indicates should be public for share pages - see note below)
- `/api/playlists/add-button` POST - Add play button to playlist
- `/api/playlists/remove-button` DELETE - Remove play button from playlist
- `/api/playlists/reorder` POST - Reorder play buttons in playlist
- `/api/playlists/update-timeout` POST - Update auto-advance timeout for playlist item
- `/api/notifications/status` GET - Get notification status (requires auth via `x-user-fid` header)
- `/api/notifications/send` POST - Send push notifications (requires auth via `x-user-fid` header)
- `/api/auth/signout` POST - Sign out user
- `/api/verify-api-key` GET - Verify API key (requires auth)
- `/api/cache-bust` GET - Cache busting endpoint (requires auth via `x-user-fid` header)
- `/api/db-test` GET, POST - Database testing endpoints (requires auth)

**Note on `/api/playlists/[id]` GET**: The route file (`app/api/playlists/[id]/route.ts`) explicitly states it's a "Public endpoint to fetch a playlist by ID for share metadata generation" and "does not require authentication". However, it's not listed in `publicRoutes` in `middleware.ts`, making it currently protected. If playlist share pages fail to load metadata, this route should be added to `publicRoutes` in the middleware.

## ✅ Production URL Handling

All code properly handles production URLs:
- Uses `process.env.NEXT_PUBLIC_APP_URL` with fallback to `https://addplaybutton.xyz`
- No hardcoded localhost references except in fallbacks
- Proper base URL handling in all API calls

## ✅ CORS and Security Headers

- Next.js config includes proper Permissions-Policy headers
- Cookies configured with `secure: true` and `sameSite: 'none'` for iframe support
- No CORS issues expected as all API calls are same-origin

## ✅ Share Page SSR

The share pages will work properly because:
1. `/share/` routes are excluded from authentication middleware
2. `/api/playbutton` GET is public for SSR data fetching
3. Proper metadata generation with fc:miniapp and fc:frame tags

## ✅ Build Configuration

- ESLint errors ignored during build (set in next.config.mjs)
- TypeScript errors ignored during build
- Standard Next.js build process compatible with Vercel

## ⚠️ Things to Verify After Deployment

1. Check server logs for any 401 errors on share pages
2. Verify cover images load properly in miniapp cards
3. Test sharing a play button and viewing the miniapp card
4. Test sharing a playlist and viewing the miniapp card (note: `/api/playlists/[id]` GET may need to be added to publicRoutes if share pages fail)
5. Ensure the embedded player launches when clicking the miniapp card
6. Verify all environment variables are properly set in Vercel dashboard
7. Test playlist creation, adding buttons, reordering, and removal
8. Test playlist timeout updates (`/api/playlists/update-timeout`)
9. Verify notifications work if NEYNAR_API_KEY is configured
10. Test authentication flow in mini-app context
11. Verify CSRF protection is working for state-changing operations (POST, PUT, DELETE)
12. Verify CSRF exempt routes work correctly (`/api/auth/farcaster`, `/api/auth/session`, `/api/auth/signout`)

## 🚀 Deployment Steps

1. Commit all changes
2. Push to main branch (or create PR)
3. Vercel will automatically deploy
4. Verify environment variables in Vercel dashboard
5. Test share functionality in production