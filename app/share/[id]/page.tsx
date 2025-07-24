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
  try {
    const { id } = params;
    const fidStr = searchParams.fid;
    const fid = fidStr ? Number(fidStr) : 12345;
    if (isNaN(fid)) {
      return <html lang="en"><body><div>Invalid FID</div></body></html>;
    }
    const playButtonData = await fetchPlayButton(fid, id);
    if (!playButtonData) {
      return <html lang="en"><body><div>Play button not found. It may have been deleted or expired.</div></body></html>;
    }
    // Redirect to main app with params for direct access
    const redirectUrl = `/?fid=${fid}&playButton=${encodeURIComponent(id)}`;
    return <html lang="en"><head><meta httpEquiv="refresh" content={`0;url=${redirectUrl}`} /></head><body>Redirecting...</body></html>;
  } catch (error) {
    console.error('Error rendering share page:', error);
    return <html lang="en"><body><div>An error occurred. Please try again later.</div></body></html>;
  }
} 