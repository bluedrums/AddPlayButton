"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"

interface CreateCastParams {
  text: string
  embeds?: Array<{ url: string }>
  playButton?: {
    id: string
    platform: string
    title: string
    artist?: string
    url: string
  }
}

interface CastResult {
  success: boolean
  cast?: {
    hash: string
    author: {
      fid: number
      username: string
    }
    text: string
    timestamp: number
  }
  warpcastUrl?: string
  error?: string
  isDemo?: boolean
}

export function useFarcasterCast() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user, authType } = useFarcaster()

  const createCast = async (params: CreateCastParams): Promise<CastResult> => {
    if (!isAuthenticated || !user) {
      throw new Error("Must be authenticated to create cast")
    }

    setIsCreating(true)
    setError(null)

    try {
      console.log("🎵 Creating cast:", {
        textLength: params.text.length,
        embedsCount: params.embeds?.length || 0,
        platform: params.playButton?.platform,
        userFid: user.fid,
        authType,
        hasSessionToken: !!user.sessionToken,
      })

      // Prepare request data
      const requestData = {
        text: params.text,
        embeds: params.embeds || [],
        playButton: params.playButton,
      }

      // Get session token for real auth
      let authToken = null
      if (authType === "real" && user.sessionToken) {
        authToken = user.sessionToken
      } else {
        // Try to get from localStorage as fallback
        const savedAuth = localStorage.getItem("farcaster-auth")
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            if (authData.sessionToken && authData.expiresAt > Date.now()) {
              authToken = authData.sessionToken
            }
          } catch (e) {
            console.log("No valid auth token found in storage")
          }
        }
      }

      console.log("🔐 Auth status:", {
        authType,
        hasToken: !!authToken,
        tokenPrefix: authToken ? authToken.substring(0, 10) + "..." : "none",
      })

      // Make API request to create cast
      const response = await fetch("/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      console.log("📡 Cast API response:", {
        success: result.success,
        isDemo: result.isDemo,
        hasWarpcastUrl: !!result.warpcastUrl,
        error: result.error,
        status: response.status,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to create cast")
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create cast"
      setError(errorMessage)
      console.error("❌ Cast creation failed:", errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
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
  ): Promise<CastResult> => {
    const defaultText =
      customText ||
      `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""} on ${playButton.platform}`

    return createCast({
      text: defaultText,
      embeds: [{ url: playButton.url }],
      playButton,
    })
  }

  const clearError = () => setError(null)

  return {
    createCast,
    createPlayButtonCast,
    isCreating,
    error,
    clearError,
  }
}
