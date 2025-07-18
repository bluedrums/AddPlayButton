import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { type NextRequest, NextResponse } from 'next/server';
const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);
export async function POST(request: NextRequest) {
  const { text, signerUuid } = await request.json();
  await client.publishCast({ signerUuid, text });
  return NextResponse.json({ success: true });
} 