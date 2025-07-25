import { fetchPlayButton } from '@/lib/fetch-playbutton';
import type { Metadata } from 'next';

export async function generateMetadata({ params, searchParams }: { params: { id: string }, searchParams: { fid?: string } }): Promise<Metadata> {
  try {
    const { id } = params;
    const fidStr = searchParams.fid;
    const fid = fidStr ? Number(fidStr) : 12345; // Fallback to demo if not provided
    if (isNaN(fid)) return {};
    const playButtonData = await fetchPlayButton(fid, id);
    if (!playButtonData) return {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const imageUrl = playButtonData.coverImage || `${baseUrl}/ThePlayButton.png`;
    const miniAppUrl = `${baseUrl}?fid=${fid}&playButton=${id}`;

    const embedJson = JSON.stringify({
      version: '1',
      imageUrl,
      button: {
        title: 'Play',
        action: {
          type: 'launch_miniapp',
          url: miniAppUrl,
          name: 'Add Play Button',
          splashImageUrl: `${baseUrl}/icon-512x512.png`,
          splashBackgroundColor: '#8b5cf6'
        }
      }
    });

    return {
      other: {
        'fc:miniapp': embedJson,
        'fc:frame': embedJson, // Backward compatibility
      }
    };
  } catch (error) {
    console.error('Error generating metadata for share page:', error);
    return {};
  }
}

export default async function SharePage({ params, searchParams }: { params: { id: string }, searchParams: { fid?: string } }) {
  const { id } = params;
  const fid = searchParams.fid ? Number(searchParams.fid) : undefined;
  const playButton = await fetchPlayButton(fid, id);

  if (!playButton) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Play Button Not Found</h1>
        <p>This play button may have been deleted or the link is expired.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{playButton.name}</h1>
      <p>To use this play button, open the link in a Farcaster client.</p>
      <img src={playButton.coverImage} alt={playButton.name} style={{ maxWidth: '100%' }} />
    </div>
  );
} 