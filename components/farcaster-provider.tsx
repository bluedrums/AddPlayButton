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
  followerCount?: number
  followingCount?: number
  verifications?: string[]
}

interface FarcasterContextType {
  user: User | null
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
  isSDKReady: true,
  authType: "demo",
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSDKReady, setIsSDKReady] = useState(true)
  const [authType, setAuthType] = useState<"real" | "demo">("demo")

  const isAuthenticated = !!user

  // Auto-authenticate on mount
  useEffect(() => {
    const autoAuth = async () => {
      console.log("🔄 Attempting auto-authentication...")
      setIsLoading(true)

      try {
        // Check for saved session
        const savedUser = localStorage.getItem("farcaster_user")
        const savedToken = localStorage.getItem("farcaster_token")
        const savedExpiry = localStorage.getItem("farcaster_expiry")

        if (savedUser && savedToken && savedExpiry) {
          const expiry = new Date(savedExpiry)
          if (expiry > new Date()) {
            const userData = JSON.parse(savedUser)
            setUser(userData)
            setAuthType(userData.isDemo ? "demo" : "real")
            console.log("✅ Restored saved session:", userData.username)
            setIsLoading(false)
            return
          } else {
            // Clear expired session
            localStorage.removeItem("farcaster_user")
            localStorage.removeItem("farcaster_token")
            localStorage.removeItem("farcaster_expiry")
          }
        }

        // Try auto-authentication
        const response = await fetch("/api/auth/quickauth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "auto_auth",
            domain: typeof window !== "undefined" ? window.location.hostname : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            referrer: typeof document !== "undefined" ? document.referrer : "",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
            setAuthType(data.isDemo ? "demo" : "real")

            // Save session
            const expiry = new Date()
            expiry.setHours(expiry.getHours() + 24) // 24 hour expiry

            localStorage.setItem("farcaster_user", JSON.stringify(data.user))
            localStorage.setItem("farcaster_token", data.sessionToken)
            localStorage.setItem("farcaster_expiry", expiry.toISOString())

            console.log("✅ Auto-authentication successful:", data.user.username, data.isDemo ? "(demo)" : "(real)")

            if (data.isDemo) {
              toast.success("Demo mode activated - open from Warpcast for real authentication")
            } else {
              toast.success("Successfully authenticated with Farcaster!")
            }
          }
        } else {
          console.log("❌ Auto-authentication failed:", response.status)
        }
      } catch (error) {
        console.error("❌ Auto-authentication error:", error)
        setError("Failed to authenticate automatically")
      } finally {
        setIsLoading(false)
      }
    }

    autoAuth()
  }, [])

  const signIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/quickauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_auth",
          domain: typeof window !== "undefined" ? window.location.hostname : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          referrer: typeof document !== "undefined" ? document.referrer : "",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          setAuthType(data.isDemo ? "demo" : "real")

          // Save session
          const expiry = new Date()
          expiry.setHours(expiry.getHours() + 24)

          localStorage.setItem("farcaster_user", JSON.stringify(data.user))
          localStorage.setItem("farcaster_token", data.sessionToken)
          localStorage.setItem("farcaster_expiry", expiry.toISOString())

          if (data.isDemo) {
            toast.success("Demo mode activated")
          } else {
            toast.success("Successfully signed in with Farcaster!")
          }
        } else {
          throw new Error(data.error || "Authentication failed")
        }
      } else {
        throw new Error("Authentication request failed")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed"
      setError(message)
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setError(null)
    setAuthType("demo")

    // Clear saved session
    localStorage.removeItem("farcaster_user")
    localStorage.removeItem("farcaster_token")
    localStorage.removeItem("farcaster_expiry")

    console.log("👋 Signed out")
  }

  const value = {
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
