import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Handle POST requests coming from Farcaster frame with post_redirect action
export async function POST(request: Request) {
  // Redirect back to the same URL but with GET so the client loads the mini-app normally
  return NextResponse.redirect(new URL(request.url), 302);
} 