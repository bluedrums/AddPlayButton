import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { type NextRequest, NextResponse } from 'next/server';
const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY! });
const client = new NeynarAPIClient(config);
export async function POST(request: NextRequest) {
  const { text, signerUuid } = await request.json();
  await client.publishCast(signerUuid, text);
  return NextResponse.json({ success: true });
} 