import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const host = url.host;

  const manifest = {
    accountAssociation: {
      header: 'eyJmaWQiOjMzNjEwMywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDNiNkI3NDkwYTFmN0MxZTY1Q0M1M2JBQzRDOTJEMTlGZDVkMTU3YzUifQ',
      payload: 'eyJkb21haW4iOiJhZGRwbGF5YnV0dG9uLnh5eiJ9',
      signature: 'MHgxZTI0NDU4YTcxNDVhYWRhMjA1ODUxMWUwOWE0NzBkYWMyYTljM2JmNDdlMDFmNTE4MWE2ZmNiN2JlZTdmNTI4NTZkYjZiZjFhMDg3YmI2YmUwMGI3ZGE0NTkzYTAyNDkyYzYyNGIxMjBjMjk2MzU4MDZlMGQyM2NjM2U3Y2JkZDFj',
      baseBuilder: {
        allowedAddresses: ['0x6D0469744c20fc303a1b17cF833DEa48bf0eed3A'],
      },
    },
    miniApp: [
      {
        version: '1',
        name: 'Add Play Button',
        homeUrl: `${origin}`,
        iconUrl: `${origin}/appicon.jpg`,
        splashImageUrl: `${origin}/ThePlayButton.png`,
        splashBackgroundColor: '#8B5CF6',
        subtitle: 'Embed media in miniapp window',
        description: 'Create shareable cards for music video links that play in the miniapp window without leaving Farcaster. Supports Spotify,Apple Music,YouTube,SoundCloud,Mixcloud,Vimeo',
        primaryCategory: 'utility',
        tags: ['music', 'video', 'media', 'embed'],
        heroImageUrl: `${origin}/HeroImage.png`,
        tagline: 'Embed media in miniapp window',
        imageUrl: `${origin}/ThePlayButton.png`,
        buttonTitle: 'Add Play Button',
        author: 'Derek Hoiem',
        website: 'https://addplaybutton.xyz',
        canonicalDomain: 'addplaybutton.xyz',
      },
    ],
  };

  return NextResponse.json(manifest);
}


