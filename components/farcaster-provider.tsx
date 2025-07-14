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

        // Check for existing auth in localStorage first
        const savedAuth = localStorage.getItem("farcaster-auth")
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            if (authData.user && authData.sessionToken && authData.expiresAt > Date.now()) {
              console.log("🔐 Found valid saved auth session")
              setUser(authData.user)
              setAuthType(authData.authType || "real")
              setError(null)
              setIsLoading(false)
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

        // Try automatic QuickAuth with real API first
        console.log("🚀 Attempting automatic QuickAuth with real Warpcast API...")
        try {
          const quickAuthResult = await attemptQuickAuth()
          if (quickAuthResult.success) {
            console.log("✅ Automatic QuickAuth successful")
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.log("⚠️ Automatic QuickAuth failed:", error)
        }

        // Fall back to demo mode
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

  const attemptQuickAuth = async () => {
    const authResponse = await fetch("/api/auth/quickauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "auto_auth",
        domain: typeof window !== "undefined" ? window.location.hostname : "localhost",
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
        referrer: typeof window !== "undefined" ? document.referrer : "",
      }),
    })

    if (!authResponse.ok) {
      throw new Error(`QuickAuth request failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()

    if (authData.success && authData.user) {
      console.log("✅ QuickAuth successful:", authData.user.username, authData.isDemo ? "(demo)" : "(real)")

      const authenticatedUser: FarcasterUser = {
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

      setUser(authenticatedUser)
      setAuthType(authData.isDemo ? "demo" : "real")
      setError(null)

      // Save auth data
      const saveData = {
        user: authenticatedUser,
        sessionToken: authData.sessionToken,
        authType: authData.isDemo ? "demo" : "real",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        timestamp: Date.now(),
      }
      localStorage.setItem("farcaster-auth", JSON.stringify(saveData))

      return { success: true }
    }

    throw new Error("QuickAuth failed - no user data received")
  }

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
      const result = await attemptQuickAuth()
      if (result.success) {
        console.log("🎉 Manual sign-in successful")
        return
      }
    } catch (err) {
      console.error("❌ Manual QuickAuth failed:", err)
      setError("Authentication failed. Using demo mode for testing.")

      // Stay in demo mode but show we tried real auth
      console.log("🎭 Falling back to demo mode after manual attempt")
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
