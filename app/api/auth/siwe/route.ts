export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';

// This endpoint simply returns a fresh nonce for QuickAuth / SIWE. The client-side
// AuthKit library will build the full SIWE message itself once it has the nonce.
export async function GET() {
  const nonce = generateNonce();
  return NextResponse.json({ nonce });
} 