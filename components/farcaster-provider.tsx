"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio?: string
  followerCount?: number
  followingCount?: number
  verifications?: string[]
}

interface FarcasterContextType {
  user: FarcasterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => void
  isSDKReady: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signIn: async () => {},
  signOut: () => {},
  isSDKReady: false,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSDKReady, setIsSDKReady] = useState(false)

  const isAuthenticated = !!user

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Initialize the SDK
        await sdk.actions.ready()
        setIsSDKReady(true)

        // Try to get existing session using Quick Auth
        try {
          const response = await sdk.quickAuth.fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "https://addplaybutton.xyz"}/api/me`,
          )

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            setError(null) // Clear any previous errors
          } else {
            // If no existing session, that's normal - don't set an error
            console.log("No existing session found")
          }
        } catch (sessionError) {
          // Session check failed, but that's okay - user just needs to sign in
          console.log("Session check failed:", sessionError)
        }
      } catch (err) {
        console.error("SDK initialization error:", err)
        setError("Failed to initialize SDK")
      } finally {
        setIsLoading(false)
      }
    }

    initializeSDK()
  }, [])

  const signIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Use Quick Auth to get authenticated session
      const response = await sdk.quickAuth.fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://addplaybutton.xyz"}/api/auth/signin`,
        {
          method: "POST",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Authentication failed")
      }

      const userData = await response.json()
      setUser(userData)
      setError(null) // Clear any errors on success
    } catch (err) {
      console.error("Sign in error:", err)
      const errorMessage = err instanceof Error ? err.message : "Sign in failed"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setError(null)
    // Clear any stored session data
    localStorage.removeItem("farcaster-session")
  }

  const value: FarcasterContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    isSDKReady,
  }

  return <FarcasterContext.Provider value={value}>{children}</FarcasterContext.Provider>
}
