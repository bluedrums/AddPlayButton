import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    console.log('Fetching metadata for URL:', url);
    
    // Check if it's a Mixcloud URL
    if (url.includes('mixcloud.com')) {
      // Extract the path from the Mixcloud URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Use Mixcloud's API
      const apiUrl = `https://api.mixcloud.com${path}`;
      console.log('Fetching from Mixcloud API:', apiUrl);
      
      const apiResponse = await fetch(apiUrl);
      if (!apiResponse.ok) {
        throw new Error(`Failed to fetch from Mixcloud API: ${apiResponse.statusText}`);
      }
      
      const data = await apiResponse.json();
      
      // Extract title and image from API response
      const title = data.name || null;
      const imageUrl = data.pictures?.large || data.pictures?.extra_large || data.pictures?.medium || null;
      const artist = data.user?.name || null;
      
      console.log('Mixcloud API result:', { imageUrl, title, artist, url });
      return NextResponse.json({ imageUrl, title, artist });
    }
    
    // For non-Mixcloud URLs, use the original HTML scraping method
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch the page: ${response.statusText}`);
    }
    const html = await response.text();
    
    // Simple regex patterns that were likely working before
    const imageUrlMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const title = titleMatch ? titleMatch[1] : null;
    
    console.log('Metadata API result:', { imageUrl, title, url });
    return NextResponse.json({ imageUrl, title });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Metadata fetching error:', message);
    return NextResponse.json({ error: 'Failed to fetch metadata', details: message }, { status: 500 });
  }
}
