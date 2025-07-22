import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!process.env.NEYNAR_API_KEY) {
      console.error('Missing NEYNAR_API_KEY');
      return NextResponse.json({ error: 'Server configuration error: Missing API key' }, { status: 500 });
    }

    const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
    const client = new NeynarAPIClient(config);

    const { signer_uuid, public_key, status } = await client.createSigner();

    console.log('Signer created:', { signer_uuid, status });
    return NextResponse.json({ success: true, signer_uuid, public_key, status });
  } catch (error) {
    console.error('Detailed signer creation error:', error);
    return NextResponse.json({ error: 'Failed to create signer: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const signer_uuid = request.nextUrl.searchParams.get('signer_uuid');

    if (!signer_uuid) {
      return NextResponse.json({ error: 'Missing signer_uuid' }, { status: 400 });
    }

    if (!process.env.NEYNAR_API_KEY) {
      console.error('Missing NEYNAR_API_KEY');
      return NextResponse.json({ error: 'Server configuration error: Missing API key' }, { status: 500 });
    }

    const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
    const client = new NeynarAPIClient(config);

    const { signers } = await client.fetchSigners({ message: signer_uuid, signature: signer_uuid });
    const signer = signers && signers.length > 0 ? signers[0] : null;
    const status = signer ? signer.status : null;

    console.log('Signer status check:', { signer_uuid, status });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Detailed signer status error:', error);
    return NextResponse.json({ error: 'Failed to fetch signer status: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
} 