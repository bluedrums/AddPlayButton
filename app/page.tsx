import type React from "react"
import type { Metadata } from "next";
import { fetchPlayButton } from "@/lib/fetch-playbutton";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Music, Video, User, AlertCircle, Loader2, Settings, LogOut, Info, Upload, X } from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
import { PlayButtonCard } from "@/components/play-button-card"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface PlayButton {
  id: string
  url: string
  platform: string
  title: string
  artist?: string
  embedUrl: string
  coverImage?: string
  createdAt: Date
}

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
          imageUrl: playButtonData.coverImage || "https://addplaybutton.xyz/og-image.png",
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
      <AddPlayButtonApp />
    </Suspense>
  );
}
