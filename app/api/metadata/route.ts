import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    console.log('Fetching metadata for URL:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch the page: ${response.statusText}`);
    }
    const html = await response.text();
    console.log('HTML length:', html.length);
    console.log('First 1000 chars of HTML:', html.substring(0, 1000));
    
    // Try multiple patterns for og:image
    let imageUrl = null;
    const imagePatterns = [
      /<meta property="og:image" content="(.*?)"/,
      /<meta name="og:image" content="(.*?)"/,
      /<meta property="twitter:image" content="(.*?)"/,
      /<meta name="twitter:image" content="(.*?)"/
    ];
    
    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        imageUrl = match[1];
        break;
      }
    }
    
    // Try multiple patterns for og:title
    let title = null;
    const titlePatterns = [
      /<meta property="og:title" content="(.*?)"/,
      /<meta name="og:title" content="(.*?)"/,
      /<meta property="twitter:title" content="(.*?)"/,
      /<meta name="twitter:title" content="(.*?)"/
    ];
    
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        title = match[1];
        break;
      }
    }
    
    console.log('Metadata API result:', { imageUrl, title, url });
    return NextResponse.json({ imageUrl, title });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Metadata fetching error:', message);
    return NextResponse.json({ error: 'Failed to fetch metadata', details: message }, { status: 500 });
  }
}
