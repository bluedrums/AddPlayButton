import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

// Define which routes are public (do not require authentication)
const publicRoutes = [
  { path: '/api/auth/farcaster', methods: ['POST'] },
  { path: '/api/auth/session', methods: ['GET', 'POST'] },
  { path: '/api/auth/status', methods: ['GET'] },
  { path: '/api/auth/csrf', methods: ['GET'] },
  { path: '/api/oembed', methods: ['GET'] },
  { path: '/api/user/casts', methods: ['GET'] },
];

// Define which routes are exempt from CSRF protection
const csrfExemptRoutes = [
  { path: '/api/auth/farcaster', methods: ['POST'] }, // Authentication endpoint
  { path: '/api/auth/session', methods: ['POST'] }, // Session creation
];

export async function middleware(request: NextRequest) {
  const { method, nextUrl } = request;
  const { pathname } = nextUrl;

  console.log(`🔍 Middleware: ${method} ${pathname}`);

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route.path) && route.methods.includes(method)
  );

  if (isPublicRoute) {
    console.log('✅ Middleware: Public route, allowing access');
    return NextResponse.next();
  }

  console.log('🔒 Middleware: Protected route, checking authentication');
  console.log('🍪 All cookies:', request.cookies.getAll());
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    console.log('🚫 Middleware: No session cookie found. Access denied.');
    console.log('📍 Request context:', {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
      cookie: request.headers.get('cookie')
    });
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    console.log('🔐 Middleware: Verifying JWT token...');
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    const fid = payload.fid as number;

    if (!fid) {
      throw new Error('Invalid token payload');
    }

    console.log(`✅ Middleware: Token valid for user ${fid}`);
    
    // CSRF Protection: Check for CSRF token on state-changing methods
    // But exempt certain routes that have their own protection
    const isCsrfExempt = csrfExemptRoutes.some(
      (route) => pathname.startsWith(route.path) && route.methods.includes(method)
    );

    if (['POST', 'PUT', 'DELETE'].includes(method) && !isCsrfExempt) {
      const csrfTokenFromHeader = request.headers.get('X-CSRF-Token');
      const csrfCookie = request.cookies.get('csrf-token');

      if (!csrfTokenFromHeader || !csrfCookie || csrfTokenFromHeader !== csrfCookie.value) {
        console.error('🚫 Middleware: CSRF token validation failed.');
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      }
    }
    
    // Pass user fid in headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-fid', fid.toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('🚫 Middleware: Invalid token. Access denied.', error);
    const response = NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    response.cookies.delete('session');
    response.cookies.delete('csrf-token');
    return response;
  }
}

export const config = {
  matcher: '/api/:path*',
};
