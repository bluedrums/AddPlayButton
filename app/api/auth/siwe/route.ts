import { NextResponse } from 'next/server';
import { generateNonce, SiweMessage } from 'siwe';

export async function GET() {
  const nonce = generateNonce();
  const message = new SiweMessage({
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'www.addplaybutton.xyz',
    uri: 'https://www.addplaybutton.xyz/login',
    statement: 'Sign in to Add Play Button',
    version: '1',
    chainId: 10, // Optimism chain
    nonce,
  });

  return NextResponse.json({ message: message.prepareMessage(), nonce });
} 