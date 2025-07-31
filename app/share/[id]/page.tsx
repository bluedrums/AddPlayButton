import { fetchPlayButton } from '@/lib/fetch-playbutton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params, searchParams }: { params: { id: string }, searchParams: { fid?: string } }): Promise<Metadata> {
  try {
    const encodedId = params.id;
    const id = decodeURIComponent(encodedId);
    const fidStr = searchParams.fid;
    const fid = fidStr ? Number(fidStr) : 12345; // Fallback to demo if not provided
    if (isNaN(fid)) return {};
    const playButtonData = await fetchPlayButton(fid, id);
    if (!playButtonData) return {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const imageUrl = playButtonData.coverImage || `${baseUrl}/ThePlayButton.png`;
    // Point directly to the mini-app home so Warpcast keeps the user inside the in-app sheet.
    const miniAppUrl = `${baseUrl}/?fid=${fid}&playButton=${encodeURIComponent(encodedId)}`;

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
        "fc:frame:post_url": `${baseUrl}/api/cast?id=${id}`,
        "fc:frame:button:1": "Play",
        "fc:frame:button:1:action": "post",
        "fc:frame:button:1:target": `${baseUrl}/api/cast?id=${id}`,
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