"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

interface User {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  bio?: string
  followerCount: number
  followingCount: number
  verifications: string[]
}

interface FarcasterContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  authType: "real" | "demo" | null
  isSDKReady: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authType: null,
  isSDKReady: false,
  signIn: async () => {},
  signOut: () => {},
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authType, setAuthType] = useState<"real" | "demo" | null>(null)
  const [isSDKReady, setIsSDKReady] = useState(false)

  const isAuthenticated = !!user

  // Load saved auth data
  useEffect(() => {
    const loadSavedAuth = () => {
      try {
        const saved = localStorage.getItem("farcaster_auth")
        if (saved) {
          const authData = JSON.parse(saved)

          // Check if auth data is still valid
          if (authData.expiresAt && authData.expiresAt > Date.now()) {
            setUser(authData.user)
            setAuthType(authData.authType)
            console.log("✅ Restored saved auth:", authData.user.username)
            setIsLoading(false)
            setIsSDKReady(true)
            return
          } else {
            // Clear expired auth
            localStorage.removeItem("farcaster_auth")
          }
        }
      } catch (error) {
        console.error("Error loading saved auth:", error)
        localStorage.removeItem("farcaster_auth")
      }

      // Try automatic authentication
      attemptQuickAuth()
    }

    loadSavedAuth()
  }, [])

  const attemptQuickAuth = async () => {
    try {
      console.log("🔄 Attempting QuickAuth...")
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/quickauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        setAuthType(data.authType)

        // Save auth data
        const authData = {
          user: data.user,
          authType: data.authType,
          expiresAt: data.expiresAt,
        }
        localStorage.setItem("farcaster_auth", JSON.stringify(authData))

        if (data.authType === "real") {
          toast.success("Successfully connected to Farcaster!")
        } else {
          toast.info("Demo mode activated - open from Warpcast for real authentication")
        }

        console.log("✅ QuickAuth successful:", data.user.username)
      } else {
        throw new Error(data.error || "Authentication failed")
      }
    } catch (error) {
      console.error("❌ QuickAuth failed:", error)
      setError(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setIsLoading(false)
      setIsSDKReady(true)
    }
  }

  const signIn = async () => {
    await attemptQuickAuth()
  }

  const signOut = () => {
    setUser(null)
    setAuthType(null)
    setError(null)
    localStorage.removeItem("farcaster_auth")
    console.log("👋 Signed out")
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    authType,
    isSDKReady,
    signIn,
    signOut,
  }

  return <FarcasterContext.Provider value={value}>{children}</FarcasterContext.Provider>
}
