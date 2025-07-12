"use client"

import { useState } from "react"
import { useFarcaster } from "@/components/farcaster-provider"
import { sdk } from "@farcaster/miniapp-sdk"

interface CreateCastParams {
  text: string
  embeds?: Array<{ url: string }>
}

export function useFarcasterCast() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useFarcaster()

  const createCast = async (params: CreateCastParams) => {
    if (!isAuthenticated) {
      throw new Error("Must be authenticated to create cast")
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await sdk.quickAuth.fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://addplaybutton.xyz"}/api/cast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create cast")
      }

      const result = await response.json()
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
