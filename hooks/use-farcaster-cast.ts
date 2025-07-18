"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"

interface CastEmbed {
  url: string
}

interface CreateCastParams {
  fid: number
  embedUrl: string
  embedType: "spotify" | "apple" | "soundcloud" | "youtube"
  title?: string
  customText?: string
  signerUuid: string  // Add this
}

interface CastResponse {
  success: boolean
  cast?: {
    hash: string
    text: string
    embeds: CastEmbed[]
    author: {
      fid: number
      username: string
    }
    timestamp: number
  }
  warpcastUrl?: string
  isDemo?: boolean
  message?: string
  error?: string
  details?: any
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
      // Use customText if provided, otherwise use defaultText
      const castText = customText || defaultText;

      // Create miniapp URL for this specific play button
      const miniappUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?playButton=${playButton.id}`;

      const signerUuid = localStorage.getItem("farcaster-signer-uuid")
      if (!signerUuid) throw new Error("Signer not approved")

      const payload: CreateCastPayload = {
        signerUuid,
        text: castText,
        embeds: [
          { url: playButton.url },
          { url: miniappUrl }
        ]
      }

      const res = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data: CastResponse = await res.json()
      setLastResponse(data)
      return data
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
