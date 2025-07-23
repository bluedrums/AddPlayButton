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
      const playButtonData = await fetchPlayButton(fid, playButtonId);
      if (playButtonData) {
        const miniAppJson = JSON.stringify({
          name: playButtonData.title,
          version: "1.0.0",
          iconUrl: "https://addplaybutton.xyz/icon-512x512.png",
          imageUrl: playButtonData.coverImage || `${process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz'}/ThePlayButton.png`,
          buttonTitle: "Play",
          homeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz'}?fid=${fid}&playButton=${playButtonId}`,
        });
        return {
          title: playButtonData.title,
          description: `Play ${playButtonData.title}${playButtonData.artist ? ` by ${playButtonData.artist}` : ""} on ${playButtonData.platform}`,
          other: {
            "fc:miniapp": miniAppJson,
            "fc:frame": miniAppJson,
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
