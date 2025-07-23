"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"
import { sdk } from '@farcaster/miniapp-sdk';

interface CastResponse {
  success: boolean
  cast?: {
    hash: string
    text?: string
    embeds?: string[]
  }
  error?: string
  details?: any
  isDemo?: boolean
  warpcastUrl?: string
}

export function useFarcasterCast() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<CastResponse | null>(null)
  const { user } = useFarcaster()

  const clearError = () => {
    setError(null)
    setLastResponse(null)
  }

  const createPlayButtonCast = async (
    playButton: {
      id: string
      platform: string
      title: string
      artist?: string
      url: string
    },
    customText?: string,
  ): Promise<CastResponse> => {
    if (!user) {
      const errorMsg = "User not authenticated"
      setError(errorMsg)
      console.error("❌ Cast creation failed:", errorMsg)
      throw new Error(errorMsg)
    }

    setIsCreating(true)
    setError(null)
    setLastResponse(null)

    try {
      const defaultText = `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""} on ${playButton.platform}`;
      const castText = customText || defaultText;

      // Use only the miniapp URL as embed - this will trigger Farcaster to fetch the meta tags
      const miniappUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?fid=${user.fid}&playButton=${playButton.id}`;
      
      const result = await sdk.actions.composeCast({ 
        text: castText, 
        embeds: [miniappUrl] 
      });

      if (result.cast) {
        const data: CastResponse = { 
          success: true, 
          cast: {
            hash: result.cast.hash,
            text: castText,
            embeds: [miniappUrl]
          }
        };
        setLastResponse(data);
        
        // Also create a storage cast for persistence (in background, no user interaction)
        const storedData = {
          id: playButton.id,
          platform: playButton.platform,
          title: playButton.title,
          artist: playButton.artist,
          embedUrl: playButton.url, // Note: this should be the embedUrl, not url
          coverImage: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/ThePlayButton.png`
        };
        const storageText = JSON.stringify(storedData);
        // Create storage cast silently in the background
        sdk.actions.composeCast({ text: storageText }).catch(console.error);
        
        return data;
      } else {
        const errorMsg = 'Cast composition canceled by user';
        setError(errorMsg);
        const data: CastResponse = { success: false, error: errorMsg };
        setLastResponse(data);
        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      console.error("❌ Cast creation failed:", {
        error: errorMessage,
        userFid: user.fid,
        playButtonId: playButton.id,
        playButtonPlatform: playButton.platform,
      })
      setError(errorMessage)
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createPlayButtonCast,
    isCreating,
    error,
    lastResponse,
    clearError,
  }
}
