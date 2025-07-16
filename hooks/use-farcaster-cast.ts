"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"

interface CastEmbed {
  url: string
}

interface CreateCastParams {
  text: string
  embeds?: CastEmbed[]
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
      const defaultText = `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""} on ${playButton.platform}`
      const castText = customText || defaultText

      // Create miniapp URL for this specific play button
      const miniappUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?playButton=${playButton.id}`

      const requestData = {
        text: castText,
        embeds: [
          { url: playButton.url }, // Original music URL
          { url: miniappUrl }, // Miniapp frame URL
        ],
        userId: user.fid,
      }

      console.log("🎵 Creating cast:", {
        textLength: castText.length,
        embedsCount: requestData.embeds.length,
        userFid: user.fid,
        userName: user.username,
        playButtonPlatform: playButton.platform,
        miniappUrl,
      })

      const response = await fetch("/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const data: CastResponse = await response.json()
      setLastResponse(data)

      console.log("📡 Cast API response:", {
        success: data.success,
        isDemo: data.isDemo,
        error: data.error,
        status: response.status,
        hasWarpcastUrl: !!data.warpcastUrl,
        details: data.details,
      })

      if (!response.ok || !data.success) {
        let errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`

        // Add detailed debugging information
        if (data.details) {
          console.error("❌ Cast creation details:", data.details)

          // Add specific suggestions based on error type
          if (data.details.suggestions) {
            errorMessage += "\n\nSuggestions:\n" + data.details.suggestions.map((s: string) => `• ${s}`).join("\n")
          }

          if (data.details.apiKeyInfo) {
            console.error("🔐 API Key Info:", data.details.apiKeyInfo)
          }
        }

        setError(errorMessage)
        throw new Error(errorMessage)
      }

      console.log("✅ Cast created successfully:", {
        hash: data.cast?.hash?.substring(0, 10),
        author: data.cast?.author?.username,
        isDemo: data.isDemo,
        warpcastUrl: data.warpcastUrl,
      })

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
