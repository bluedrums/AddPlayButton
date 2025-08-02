# Vercel Production Deployment Verification Checklist

## ✅ Environment Variables Required

The following environment variables must be set in Vercel:

### Required Variables:
- `JWT_SECRET_KEY` - Required for authentication (used in middleware.ts and auth routes)
- `POSTGRES_URL` - Required for database connection (used in auth/session)
- `NEXT_PUBLIC_APP_URL` - Should be set to `https://addplaybutton.xyz` (has fallback)

### Optional Variables:
- `NEXT_PUBLIC_APP_DOMAIN` - Defaults to window.location.hostname if not set
- `NEXT_PUBLIC_USDC_ADDRESS` - For donation feature (has fallback)
- `WARPCAST_API_KEY` - For fetching user casts (optional feature)

## ✅ Middleware Configuration

The middleware has been properly configured to:
1. Allow public access to `/api/playbutton` GET endpoint
2. Allow public access to `/api/metadata` GET endpoint  
3. Allow public access to `/api/oembed` GET endpoint
4. Allow unauthenticated access to `/share/` pages
5. Use proper cookie settings with `sameSite: 'none'` for iframe contexts

## ✅ API Routes Verification

### Public Routes (No Auth Required):
- `/api/playbutton` GET - For fetching play button data on share pages
- `/api/metadata` GET - For fetching OG metadata from URLs
- `/api/oembed` GET - For fetching oEmbed data
- `/api/auth/farcaster` POST - For authentication
- `/api/auth/session` GET/POST - For session management
- `/api/auth/csrf` GET - For CSRF token
- `/api/user/casts` GET - For fetching user casts

### Protected Routes:
- `/api/playbutton` POST/DELETE - Requires authentication
- `/api/playbutton/all` GET - Requires authentication
- `/api/me` GET - Requires authentication

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
4. Ensure the embedded player launches when clicking the miniapp card
5. Verify all environment variables are properly set in Vercel dashboard

## 🚀 Deployment Steps

1. Commit all changes
2. Push to main branch (or create PR)
3. Vercel will automatically deploy
4. Verify environment variables in Vercel dashboard
5. Test share functionality in production