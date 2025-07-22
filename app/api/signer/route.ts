import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!process.env.NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Missing NEYNAR_API_KEY' }, { status: 500 });
    }

    const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
    const client = new NeynarAPIClient(config);

    // approval_url does not exist on type 'Signer', so we omit it
    const { signer_uuid, public_key, status } = await client.createSigner();

    return NextResponse.json({ success: true, signer_uuid, public_key, status });
  } catch (error) {
    console.error('Signer creation error:', error);
    return NextResponse.json({ error: 'Failed to create signer' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const signer_uuid = request.nextUrl.searchParams.get('signer_uuid');

    if (!signer_uuid) {
      return NextResponse.json({ error: 'Missing signer_uuid' }, { status: 400 });
    }

    if (!process.env.NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Missing NEYNAR_API_KEY' }, { status: 500 });
    }

    const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
    const client = new NeynarAPIClient(config);

    const { signers } = await client.fetchSigners({ message: signer_uuid, signature: signer_uuid });
    const signer = signers && signers.length > 0 ? signers[0] : null;
    const status = signer ? signer.status : null;

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Signer status error:', error);
    return NextResponse.json({ error: 'Failed to fetch signer status' }, { status: 500 });
  }
} 