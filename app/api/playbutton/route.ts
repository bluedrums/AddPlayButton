import { NextResponse } from 'next/server';
import { fetchPlayButton } from '@/lib/fetch-playbutton';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = searchParams.get('fid');
    const id = searchParams.get('playButton');

    if (!fidStr || !id) {
      return NextResponse.json({ error: 'Missing fid or playButton id' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    // Check if Neynar API key is configured
    if (!process.env.NEYNAR_API_KEY) {
      console.error('NEYNAR_API_KEY environment variable is not set');
      // Return a mock response for development/testing
      return NextResponse.json({ 
        error: 'Neynar API key not configured in development environment',
        mock: true,
        data: {
          id: id,
          platform: "Spotify",
          title: "Test Play Button",
          artist: "Test Artist", 
          embedUrl: "https://open.spotify.com/embed/track/test",
          coverImage: "https://addplaybutton.xyz/ThePlayButton.png"
        }
      }, { status: 200 });
    }

    const playButtonData = await fetchPlayButton(fid, id);

    if (!playButtonData) {
      return NextResponse.json({ error: 'Play button not found' }, { status: 404 });
    }

    return NextResponse.json(playButtonData);
  } catch (error) {
    console.error('Error in playbutton API route:', error);
    return NextResponse.json({ 
      error: 'Internal server error while fetching play button data' 
    }, { status: 500 });
  }
} 