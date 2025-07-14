"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio?: string
  followerCount?: number
  followingCount?: number
  verifications?: string[]
  sessionToken?: string
}

interface FarcasterContextType {
  user: FarcasterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => void
  isSDKReady: boolean
  authType: "real" | "demo"
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signIn: async () => {},
  signOut: () => {},
  isSDKReady: false,
  authType: "demo",
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [authType, setAuthType] = useState<"real" | "demo">("demo")

  const isAuthenticated = !!user

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsSDKReady(true)

        // Check for existing auth in localStorage
        const savedAuth = localStorage.getItem("farcaster-auth")
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            if (authData.user && authData.sessionToken && authData.expiresAt > Date.now()) {
              console.log("🔐 Found valid saved auth session")
              setUser(authData.user)
              setAuthType("real")
              setError(null)
              return
            } else {
              console.log("🔐 Saved auth expired, clearing...")
              localStorage.removeItem("farcaster-auth")
            }
          } catch (e) {
            console.error("Error parsing saved auth:", e)
            localStorage.removeItem("farcaster-auth")
          }
        }

        // Start with demo user for immediate functionality
        console.log("🎭 Starting with demo mode")
        await createDemoUser()
      } catch (error) {
        console.error("Auth initialization error:", error)
        await createDemoUser()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const createDemoUser = async () => {
    const demoUser: FarcasterUser = {
      fid: 12345,
      username: "demo_user",
      displayName: "Demo User",
      pfpUrl: "/placeholder-user.jpg",
      bio: "Demo user for testing the Add Play Button app",
      followerCount: 100,
      followingCount: 50,
      verifications: [],
    }

    setUser(demoUser)
    setAuthType("demo")
    setError(null)
  }

  const signIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🚀 Attempting QuickAuth authentication")

      // Use QuickAuth for mini apps
      const authResponse = await fetch("/api/auth/quickauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_auth",
          domain: window.location.hostname,
        }),
      })

      if (!authResponse.ok) {
        throw new Error("QuickAuth request failed")
      }

      const authData = await authResponse.json()

      if (authData.success && authData.user) {
        console.log("✅ QuickAuth successful:", authData.user.username)

        const realUser: FarcasterUser = {
          fid: authData.user.fid,
          username: authData.user.username,
          displayName: authData.user.displayName,
          pfpUrl: authData.user.pfpUrl || "/placeholder-user.jpg",
          bio: authData.user.bio,
          followerCount: authData.user.followerCount,
          followingCount: authData.user.followingCount,
          verifications: authData.user.verifications || [],
          sessionToken: authData.sessionToken,
        }

        setUser(realUser)
        setAuthType("real")

        // Save auth data
        const saveData = {
          user: realUser,
          sessionToken: authData.sessionToken,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          timestamp: Date.now(),
        }
        localStorage.setItem("farcaster-auth", JSON.stringify(saveData))

        return
      }

      throw new Error("QuickAuth failed - no user data received")
    } catch (err) {
      console.error("❌ QuickAuth failed:", err)
      setError("Authentication failed. Using demo mode for testing.")

      // Stay in demo mode but show we tried real auth
      console.log("🎭 Falling back to demo mode")
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem("farcaster-auth")
    setUser(null)
    setAuthType("demo")
    setError(null)

    // Create new demo user
    createDemoUser()
  }

  const value: FarcasterContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    isSDKReady,
    authType,
  }

  return <FarcasterContext.Provider value={value}>{children}</FarcasterContext.Provider>
}
