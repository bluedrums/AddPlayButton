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
        // Generate HTML meta tags ("wrapper") based on verified data
        const miniappEmbed = {
          version: "1",
          imageUrl: playButtonData.coverImage || `${process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz'}/ThePlayButton.png`,
          button: {
            title: "Play",
            action: {
              type: "launch_miniapp",
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz'}?fid=${fid}&playButton=${encodeURIComponent(decodedId)}`,
              name: "Add Play Button",
              splashImageUrl: "https://addplaybutton.xyz/icon-512x512.png",
              splashBackgroundColor: "#8b5cf6"
            }
          }
        };
        
        const miniappJson = JSON.stringify(miniappEmbed);
        
        return {
          title: playButtonData.title,
          description: `Play ${playButtonData.title}${playButtonData.artist ? ` by ${playButtonData.artist}` : ""} on ${playButtonData.platform}`,
          other: {
            "fc:miniapp": miniappJson,
            "fc:frame": miniappJson, // Backward compatibility
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
