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

export function useFarcasterCast() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user } = useFarcaster()

  const createCast = async ({ text, embeds }: CreateCastParams): Promise<boolean> => {
    if (!user) {
      setError("User not authenticated")
      return false
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          embeds: embeds || [],
          userId: user.fid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create cast")
      }

      setSuccess(true)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createCast,
    isLoading,
    error,
    success,
  }
}
