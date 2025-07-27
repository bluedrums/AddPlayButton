import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const url = new URL(request.url);
  // Preserve query params when redirecting
  return NextResponse.redirect(`${url.origin}/?${url.searchParams.toString()}`, 302);
} 