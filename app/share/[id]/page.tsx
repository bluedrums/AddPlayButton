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
    
    console.log('PlayButton metadata generation:', { 
      id, 
      fid, 
      hasCoverImage: !!playButtonData.coverImage,
      coverImage: playButtonData.coverImage,
      imageUrl,
      playButtonData 
    });
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
        // Consolidated Mini App embed (new spec)
        "fc:miniapp": JSON.stringify({
          version: "1",
          imageUrl,
          button: {
            title: "Play",
            action: {
              type: "launch_frame",
              name: "Add Play Button",
              url: miniAppUrl,
            },
          },
        }),
        // Duplicate under fc:frame for backward-compatibility with older clients
        "fc:frame": JSON.stringify({
          version: "1",
          imageUrl,
          button: {
            title: "Play",
            action: {
              type: "launch_frame",
              name: "Add Play Button",
              url: miniAppUrl,
            },
          },
        }),

        // Optional OpenFrame / XMTP tags to support cross-protocol previews
        "of:accepts:farcaster": "vNext",
        "of:accepts:xmtp": "2024-02-01",
        "of:image": imageUrl,
        "of:image:aspect_ratio": "1.91:1",
        "of:button:1": "Play",
        "of:button:1:action": "link",
        "of:button:1:target": miniAppUrl,
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
      {playButton.coverImage ? (
        <img src={playButton.coverImage} alt={playButton.title} style={{ maxWidth: '100%' }} />
      ) : (
        <p>No cover image available</p>
      )}
      <pre style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', overflow: 'auto' }}>
        {JSON.stringify(playButton, null, 2)}
      </pre>
    </div>
  );
} 