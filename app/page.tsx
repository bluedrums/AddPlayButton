import type { Metadata } from "next";
import { fetchPlayButton } from "@/lib/fetch-playbutton";
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | undefined } }): Promise<Metadata> {
  const fidStr = searchParams.fid;
  const playButtonId = searchParams.playButton;
  if (fidStr && playButtonId) {
    const fid = Number(fidStr);
    if (!isNaN(fid)) {
      const decodedId = decodeURIComponent(playButtonId);
      const playButtonData = await fetchPlayButton(fid, decodedId); // Secure fetch from casts
      if (playButtonData) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
        const imageUrl = playButtonData.coverImage || `${baseUrl}/ThePlayButton.png`;
        const miniAppUrl = `${baseUrl}?fid=${fid}&playButton=${encodeURIComponent(decodedId)}`;
        const title = playButtonData.title;
        const description = `Play ${playButtonData.title} on ${playButtonData.platform}`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            images: [imageUrl],
          },
          other: {
            "fc:frame": "vNext",
            "fc:frame:image": imageUrl,
            "fc:frame:image:aspect_ratio": "1:1",
            "fc:frame:button:1": "Play",
            "fc:frame:button:1:action": "link",
            "fc:frame:button:1:target": miniAppUrl,
          },
        };
      }
    }
  }
  return {
    title: "Add Play Button - Farcaster Mini App",
    description: "Transform your music and video links into interactive play buttons for Farcaster",
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  );
}
