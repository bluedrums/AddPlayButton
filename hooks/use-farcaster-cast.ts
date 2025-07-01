"use client"

import { useState } from "react"
import { formatCastText } from "@/lib/farcaster"

interface CastState {
  isSubmitting: boolean
  error: string | null
  lastCast: any | null
}

interface CreateCastParams {
  fid: number
  embedUrl: string
  embedType: "spotify" | "apple" | "soundcloud" | "youtube"
  title?: string
  customText?: string
}

export function useFarcasterCast() {
  const [castState, setCastState] = useState<CastState>({
    isSubmitting: false,
    error: null,
    lastCast: null,
  })

  const createCast = async (params: CreateCastParams) => {
    setCastState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const castText = params.customText || formatCastText(params.embedType, params.title)

      const response = await fetch("/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fid: params.fid,
          text: castText,
          embedUrl: params.embedUrl,
          embedType: params.embedType,
          title: params.title,
          signerUuid: "mock_signer", // In production, this would be a real signer
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create cast")
      }

      setCastState({
        isSubmitting: false,
        error: null,
        lastCast: data.cast,
      })

      return data.cast
    } catch (error: any) {
      console.error("Cast creation error:", error)
      setCastState({
        isSubmitting: false,
        error: error.message || "Failed to create cast",
        lastCast: null,
      })
      throw error
    }
  }

  const clearError = () => {
    setCastState((prev) => ({ ...prev, error: null }))
  }

  return {
    ...castState,
    createCast,
    clearError,
  }
}
