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
    const miniAppUrl = `${baseUrl}/open?fid=${fid}&playButton=${encodeURIComponent(id)}`;

    return {
      title: playButtonData.title,
      description: `Play "${playButtonData.title}" using the Add Play Button mini-app`,
      openGraph: {
        title: playButtonData.title,
        description: `Play on ${playButtonData.platform}`,
        images: [imageUrl],
      },
      other: {
        "fc:frame": "vNext",
        "fc:frame:image": imageUrl,
        "fc:frame:image:aspect_ratio": "1.91:1",
        "fc:frame:button:1": "▶️ Play",
        "fc:frame:button:1:action": "post_redirect",
        "fc:frame:button:1:target": miniAppUrl,
        "of:accepts:farcaster": "vNext",
        "of:accepts:xmtp": "2024-02-01",
        "of:image": imageUrl,
        "of:image:aspect_ratio": "1.91:1",
        "of:button:1": "▶️ Play",
        "of:button:1:action": "post_redirect",
        "of:button:1:target": miniAppUrl,
        "of:post_url": miniAppUrl,
      }
    };
  } catch (error) {
    console.error('Error generating metadata for share page:', error);
    return {};
  }
}

export default async function SharePage({ params, searchParams }: { params: { id: string }, searchParams: { fid?: string } }) {
  const { id } = params;
  const fidStr = searchParams.fid;
  const fid = fidStr ? Number(fidStr) : 12345;
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
      <h1>{playButton.title}</h1>
      <p>To use this play button, open the link in a Farcaster client.</p>
      <img src={playButton.coverImage} alt={playButton.title} style={{ maxWidth: '100%' }} />
    </div>
  );
} 