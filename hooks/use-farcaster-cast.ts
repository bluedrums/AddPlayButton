"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"

interface CreateCastParams {
  text: string
  embeds?: Array<{ url: string }>
}

export function useFarcasterCast() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useFarcaster()

  const createCast = async (params: CreateCastParams) => {
    if (!isAuthenticated || !user) {
      throw new Error("Must be authenticated to create cast")
    }

    setIsCreating(true)
    setError(null)

    try {
      // For demo purposes, simulate cast creation
      // In a real Mini App, this would use the SDK's casting methods

      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      // Create a mock successful response
      const mockCastHash = `0x${Math.random().toString(16).substring(2, 10)}`
      const result = {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create cast"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const clearError = () => setError(null)

  return {
    createCast,
    isCreating,
    error,
    clearError,
  }
}
