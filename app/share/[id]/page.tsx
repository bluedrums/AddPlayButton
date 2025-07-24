import { fetchPlayButton } from '@/lib/fetch-playbutton';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  // Assuming fid is passed or derived; for simplicity, using a placeholder or query param if needed
  const fid = 12345; // Replace with actual fid logic, e.g., from session or query
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
}

export default async function SharePage({ params }: { params: { id: string } }) {
  return (
    <html lang="en">
      <head />
      <body>
        <h1>Play Button Shared</h1>
        <p>This page is for embedding in Farcaster casts. Open in a Farcaster client to interact.</p>
      </body>
    </html>
  );
} 