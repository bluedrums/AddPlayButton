import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { type NextRequest, NextResponse } from 'next/server';

const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY! });
const client = new NeynarAPIClient(config);

export async function POST() {
  try {
    const signer = await client.createSigner();
    return NextResponse.json({
      success: true,
      signer_uuid: signer.signer_uuid,
      approval_url: signer.approval_url,
      status: signer.status
    });
  } catch (error) {
    console.error('Signer creation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create signer' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const signerUuid = request.nextUrl.searchParams.get('signer_uuid');
  
  if (!signerUuid) {
    return NextResponse.json({ success: false, error: 'signer_uuid required' }, { status: 400 });
  }
  
  try {
    const status = await client.lookupSigner({ signerUuid });
    return NextResponse.json({
      success: true,
      status: status.status,
      fid: status.fid
    });
  } catch (error) {
    console.error('Signer lookup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to lookup signer' }, { status: 500 });
  }
} 