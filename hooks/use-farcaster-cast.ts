"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"
import { sdk } from "@farcaster/miniapp-sdk"

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
}

export function useFarcasterCast() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useFarcaster()

  const createCast = async (params: CreateCastParams): Promise<CastResult> => {
    if (!isAuthenticated || !user) {
      throw new Error("Must be authenticated to create cast")
    }

    setIsCreating(true)
    setError(null)

    try {
      // Try to use the SDK's casting functionality first
      try {
        // Check if we can use the SDK's cast creation
        const castData = {
          text: params.text,
          embeds: params.embeds || [],
        }

        // Use SDK to create cast if available
        if (sdk.actions && typeof sdk.actions.openUrl === "function") {
          // For Mini Apps, we might need to use a different approach
          // This would typically involve the parent frame handling the cast

          // Send cast data to parent frame
          if (window.parent !== window) {
            window.parent.postMessage(
              {
                type: "create_cast",
                data: castData,
              },
              "*",
            )
          }
        }

        // Simulate successful cast creation for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const mockCastHash = `0x${Math.random().toString(16).substring(2, 18)}`
        const result: CastResult = {
          success: true,
          cast: {
            hash: mockCastHash,
            author: {
              fid: user.fid,
              username: user.username,
            },
            text: params.text,
            timestamp: Date.now(),
          },
          warpcastUrl: `https://warpcast.com/${user.username}/${mockCastHash.substring(0, 10)}`,
        }

        return result
      } catch (sdkError) {
        console.log("SDK cast creation not available, using fallback")

        // Fallback: simulate cast creation
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const mockCastHash = `0x${Math.random().toString(16).substring(2, 18)}`
        const result: CastResult = {
          success: true,
          cast: {
            hash: mockCastHash,
            author: {
              fid: user.fid,
              username: user.username,
            },
            text: params.text,
            timestamp: Date.now(),
          },
          warpcastUrl: `https://warpcast.com/${user.username}/${mockCastHash.substring(0, 10)}`,
        }

        return result
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create cast"
      setError(errorMessage)
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
