import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  return NextResponse.redirect(`${url.origin}/?${params}`, 302);
} 