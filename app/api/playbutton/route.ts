import { NextResponse } from 'next/server';

// In-memory storage (for demo; use a real DB in production)
const playButtonStore = new Map<string, any>(); // Key: `${fid}_${id}`, Value: playButtonData

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidStr = searchParams.get('fid');
    const id = searchParams.get('id');

    if (!fidStr || !id) {
      return NextResponse.json({ error: 'Missing fid or id' }, { status: 400 });
    }

    const fid = Number(fidStr);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    const key = `${fid}_${id}`;
    const playButton = playButtonStore.get(key);

    if (!playButton) {
      return NextResponse.json({ error: 'Play button not found' }, { status: 404 });
    }

    return NextResponse.json({ playButton });
  } catch (error) {
    console.error('Error in playbutton GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, id, data } = body;

    if (!fid || !id || !data) {
      return NextResponse.json({ error: 'Missing fid, id, or data' }, { status: 400 });
    }

    const key = `${fid}_${id}`;
    playButtonStore.set(key, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playbutton POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 