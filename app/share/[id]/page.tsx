import { fetchPlayButton } from '@/lib/fetch-playbutton';
import { fetchPlaylist, Playlist } from '@/lib/fetch-playlist';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fid?: string; playlistId?: string; startIndex?: string }>;
};

export async function generateMetadata({ 
  params, 
  searchParams 
}: Props): Promise<Metadata> {
  try {
    // In Next.js 15, params and searchParams are Promises
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    
    const encodedId = resolvedParams.id;
    const id = decodeURIComponent(encodedId);
    const fidStr = resolvedSearchParams.fid;
    const playlistIdStr = resolvedSearchParams.playlistId;
    const startIndexStr = resolvedSearchParams.startIndex;

    const fid = fidStr ? Number(fidStr) : undefined;
    
    let playButtonData;
    let playlist: Playlist | null = null;
    let startIndex = 0;

    // If playlist context is provided, fetch the full playlist
    if (playlistIdStr) {
      const playlistId = Number(playlistIdStr);
      if (!isNaN(playlistId)) {
        playlist = await fetchPlaylist(playlistId);
        if (playlist && playlist.play_buttons) {
          startIndex = Math.min(
            Math.max(0, Number(startIndexStr) || 0),
            playlist.play_buttons.length - 1
          );
          // The play button ID in the URL is the starting track
          playButtonData = playlist.play_buttons.find(pb => pb.id === id);
        }
      }
    }

    // If no playlist context, or if track not found in playlist, fetch individually
    if (!playButtonData) {
      playButtonData = await fetchPlayButton(fid || 12345, id);
    }
    
    if (!playButtonData) return {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const imageUrl = playButtonData.coverImage || `${baseUrl}/ThePlayButton.png`;
    
    // Create a dynamic title based on playlist context
    const title = playlist 
      ? `${playButtonData.title} - ${playlist.name}` 
      : playButtonData.title;
      
    const description = playlist
      ? `Track ${startIndex + 1} of ${playlist.play_buttons.length} in ${playlist.name}`
      : `Play on ${playButtonData.platform}`;
        
    const buttonTitle = playlist 
      ? `Play from #${startIndex + 1}`
      : 'Play';

    const miniAppUrl = baseUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [imageUrl],
      },
      other: {
        "fc:miniapp": JSON.stringify({
          version: "1",
          imageUrl,
          button: {
            title: buttonTitle,
            action: {
              type: "launch_frame",
              name: "Add Play Button",
              url: miniAppUrl,
            },
          },
        }),
        "fc:frame": JSON.stringify({
          version: "1",
          imageUrl,
          button: {
            title: buttonTitle,
            action: {
              type: "launch_frame",
              name: "Add Play Button",
              url: miniAppUrl,
            },
          },
        }),
        "of:accepts:farcaster": "vNext",
        "of:accepts:xmtp": "2024-02-01",
        "of:image": imageUrl,
        "of:image:aspect_ratio": "1.91:1",
        "of:button:1": buttonTitle,
        "of:button:1:action": "link",
        "of:button:1:target": miniAppUrl,
      }
    };
  } catch (error) {
    console.error('Error generating metadata for share page:', error);
    return {};
  }
}

export default async function SharePage({ 
  params, 
  searchParams 
}: Props) {
  // In Next.js 15, params and searchParams are Promises
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const id = decodeURIComponent(resolvedParams.id);
  const fidStr = resolvedSearchParams.fid;
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
      <p>To use this play button, open the link in the Base app or a Farcaster client.</p>
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
