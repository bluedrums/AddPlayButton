import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { method } = request;
  const { pathname } = request.nextUrl;

  // Define which routes require authentication
  const protectedRoutes = [
    { path: '/api/playbutton', methods: ['POST', 'DELETE'] },
    { path: '/api/playbutton/all', methods: ['GET'] },
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route.path && route.methods.includes(method)
  );

  // If the route is not protected, allow the request to pass through
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');

  // If no session cookie, block access
  if (!sessionCookie) {
    console.log('🚫 Middleware: No session cookie found. Access denied.');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Verify the JWT
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    const fid = payload.fid as number;

    if (!fid) {
      throw new Error('Invalid token payload');
    }

    // Add user fid to the request headers to be used in the API route
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-fid', fid.toString());

    // Allow the request to proceed with the new headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('🚫 Middleware: Invalid token. Access denied.', error);
    // Clear the invalid cookie
    const response = NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    response.cookies.delete('session');
    return response;
  }
}

// Update the matcher to run on all API routes, so the logic inside can decide
export const config = {
  matcher: '/api/:path*',
}; 