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
    
    // Enhanced regex patterns to handle different quote styles and formats
    // Try og:image with double quotes
    let imageUrlMatch = html.match(/<meta\s+(?:name|property)="og:image"\s+content="([^"]+)"/i);
    // Try og:image with single quotes
    if (!imageUrlMatch) {
      imageUrlMatch = html.match(/<meta\s+(?:name|property)='og:image'\s+content='([^']+)'/i);
    }
    // Try og:image without quotes
    if (!imageUrlMatch) {
      imageUrlMatch = html.match(/<meta\s+(?:name|property)=["']?og:image["']?\s+content=([^\s>]+)/i);
    }
    // Try Twitter card image as fallback
    if (!imageUrlMatch) {
      imageUrlMatch = html.match(/<meta\s+(?:name|property)="twitter:image"\s+content="([^"]+)"/i);
    }
    // Try link rel="image_src" as another fallback
    if (!imageUrlMatch) {
      imageUrlMatch = html.match(/<link\s+rel=["']?image_src["']?\s+href=["']?([^"'\s>]+)/i);
    }
    const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;

    // Extract title - try og:title first
    let titleMatch = html.match(/<meta\s+(?:name|property)="og:title"\s+content="([^"]+)"/i);
    if (!titleMatch) {
      titleMatch = html.match(/<meta\s+(?:name|property)='og:title'\s+content='([^']+)'/i);
    }
    let title = titleMatch ? titleMatch[1] : null;

    // Fallback to regular title tag
    if (!title) {
      titleMatch = html.match(/<title>(.*?)<\/title>/i);
      title = titleMatch ? titleMatch[1] : null;
    }

    // Extract artist/author information
    let artist: string | null = null;
    // Try og:site_name (often used for artist/band name on Bandcamp)
    let artistMatch = html.match(/<meta\s+(?:name|property)="og:site_name"\s+content="([^"]+)"/i);
    if (artistMatch) {
      artist = artistMatch[1];
    }
    // Try music:musician or music:artist
    if (!artist) {
      artistMatch = html.match(/<meta\s+(?:name|property)="music:musician"\s+content="([^"]+)"/i);
      if (artistMatch) {
        artist = artistMatch[1];
      }
    }
    if (!artist) {
      artistMatch = html.match(/<meta\s+(?:name|property)="music:artist"\s+content="([^"]+)"/i);
      if (artistMatch) {
        artist = artistMatch[1];
      }
    }
    // Try author meta tag
    if (!artist) {
      artistMatch = html.match(/<meta\s+(?:name|property)="author"\s+content="([^"]+)"/i);
      if (artistMatch) {
        artist = artistMatch[1];
      }
    }
    
    console.log('Metadata API result:', { imageUrl, title, artist, url });
    return NextResponse.json({ imageUrl, title, artist: artist || undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Metadata fetching error:', message);
    return NextResponse.json({ error: 'Failed to fetch metadata', details: message }, { status: 500 });
  }
}
