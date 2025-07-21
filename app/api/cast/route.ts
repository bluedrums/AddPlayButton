import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text, signerUuid } = await request.json();

    if (!process.env.NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Missing NEYNAR_API_KEY' }, { status: 500 });
    }

    if (!text || !signerUuid) {
      return NextResponse.json({ error: 'Missing text or signerUuid' }, { status: 400 });
    }

    const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
    const client = new NeynarAPIClient(config);

    await client.publishCast({ signerUuid, text });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cast publishing error:', error);
    return NextResponse.json({ error: 'Failed to publish cast' }, { status: 500 });
  }
} 