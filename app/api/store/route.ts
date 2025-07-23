import { NextResponse, NextRequest } from 'next/server';
import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function POST(request: NextRequest) {
  const { signerUuid, text } = await request.json();
  if (!signerUuid || !text) {
    return NextResponse.json({ success: false, error: 'signerUuid and text required' }, { status: 400 });
  }
  try {
    const client = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));
    const response = await client.publishCast({ signerUuid, text });
    const hash = response.cast.hash;
    return NextResponse.json({ success: true, hash });
  } catch (error) {
    console.error('Failed to publish storage cast:', error);
    return NextResponse.json({ success: false, error: 'Failed to publish storage cast' }, { status: 500 });
  }
} 