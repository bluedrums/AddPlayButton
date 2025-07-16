"use client"

import { useState } from "react"

interface CastData {
  text: string
  embeds?: Array<{ url: string }>
  parentUrl?: string
}

interface PlayButton {
  id: string
  url: string
  platform: string
  title: string
  artist?: string
  embedUrl: string
  coverImage?: string
}

export function useFarcasterCast() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const createPlayButtonCast = async (playButton: PlayButton, text: string) => {
    setIsCreating(true)
    setError(null)

    try {
      // Create miniapp URL for this specific play button
      const miniappUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?playButton=${playButton.id}`

      const castData: CastData = {
        text,
        embeds: [
          { url: playButton.url }, // Original music URL
          { url: miniappUrl }, // Miniapp frame URL
        ],
      }

      const response = await fetch("/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(castData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create cast")
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
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
    clearError,
  }
}
