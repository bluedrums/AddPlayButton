import { NextResponse } from 'next/server';
import { fetchPlayButton } from '@/lib/fetch-playbutton';

export async function GET(request: Request) {
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

  const playButtonData = await fetchPlayButton(fid, id);

  if (!playButtonData) {
    return NextResponse.json({ error: 'Play button not found' }, { status: 404 });
  }

  return NextResponse.json(playButtonData);
} 