import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  // Try to get the token from the cookies
  let csrfToken = request.cookies.get('csrf-token')?.value;
  let response: NextResponse;

  if (!csrfToken) {
    // If it doesn't exist, generate a new one
    csrfToken = nanoid();
    console.log(`✨ Generated new CSRF token: ${csrfToken}`);
    // Create a response to set the new cookie
    response = NextResponse.json({ csrfToken });
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // Must be readable by the client-side script
      secure: true, // Always true for iframe context
      sameSite: 'none', // Required for cross-site iframe context
      path: '/',
    });
  } else {
    // If the token already exists, just return it
    console.log(`✅ Using existing CSRF token: ${csrfToken}`);
    response = NextResponse.json({ csrfToken });
  }

  return response;
}
