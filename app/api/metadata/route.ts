import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    console.log('Fetching metadata for URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch the page: ${response.statusText}`);
    }
    const html = await response.text();
    
    // Simple regex patterns that were likely working before
    const imageUrlMatch = html.match(/<meta\s+(?:name|property)="og:image"\s+content="(.*?)"/);
    const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;

    let titleMatch = html.match(/<meta\s+(?:name|property)="og:title"\s+content="(.*?)"/);
    let title = titleMatch ? titleMatch[1] : null;

    if (!title) {
      titleMatch = html.match(/<title>(.*?)<\/title>/);
      title = titleMatch ? titleMatch[1] : null;
    }
    
    console.log('Metadata API result:', { imageUrl, title, url });
    return NextResponse.json({ imageUrl, title });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Metadata fetching error:', message);
    return NextResponse.json({ error: 'Failed to fetch metadata', details: message }, { status: 500 });
  }
}
