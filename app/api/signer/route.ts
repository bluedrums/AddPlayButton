import { NextResponse, NextRequest } from 'next/server';
import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function POST() {
  try {
    const client = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));
    const { signer_uuid, public_key, status, signer_approval_url } = await client.createSigner();
    return NextResponse.json({ success: true, signer_uuid, public_key, status, signer_approval_url });
  } catch (error) {
    console.error('Failed to create signer:', error);
    return NextResponse.json({ success: false, error: 'Failed to create signer' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const signer_uuid = request.nextUrl.searchParams.get('signer_uuid');
  if (!signer_uuid) {
    return NextResponse.json({ success: false, error: 'signer_uuid required' }, { status: 400 });
  }
  try {
    const client = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));
    const { status } = await client.lookupSigner({ signerUuid: signer_uuid });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Failed to check signer:', error);
    return NextResponse.json({ success: false, error: 'Failed to check signer' }, { status: 500 });
  }
} 