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

        // Check if we're in a Farcaster frame context
        const isInFrame = window.self !== window.top
        if (isInFrame) {
          console.log("🖼️ Running in Farcaster frame - checking for user context")

          // Listen for user data from parent frame
          const handleMessage = (event: MessageEvent) => {
            if (event.data.type === "farcaster_user") {
              console.log("👤 Received user data from frame:", event.data.user)
              const frameUser: FarcasterUser = {
                fid: event.data.user.fid,
                username: event.data.user.username,
                displayName: event.data.user.displayName || event.data.user.username,
                pfpUrl: event.data.user.pfpUrl || "/placeholder-user.jpg",
                bio: event.data.user.bio,
                followerCount: event.data.user.followerCount,
                followingCount: event.data.user.followingCount,
                verifications: event.data.user.verifications || [],
                sessionToken: event.data.sessionToken,
              }

              setUser(frameUser)
              setAuthType("real")
              setError(null)

              // Save auth data
              if (event.data.sessionToken) {
                const authData = {
                  user: frameUser,
                  sessionToken: event.data.sessionToken,
                  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                  timestamp: Date.now(),
                }
                localStorage.setItem("farcaster-auth", JSON.stringify(authData))
              }
            }
          }

          window.addEventListener("message", handleMessage)

          // Request user data from parent
          window.parent.postMessage({ type: "request_user_data" }, "*")

          // Cleanup
          return () => window.removeEventListener("message", handleMessage)
        }

        // Not in frame - create demo user for testing
        console.log("🎭 Not in Farcaster frame - using demo mode")
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
      // Check if we're in a Farcaster context first
      const isInFrame = window.self !== window.top

      if (isInFrame) {
        // Request authentication from parent frame
        window.parent.postMessage({ type: "request_auth" }, "*")

        // Wait for auth response
        await new Promise((resolve, reject) => {
          const handleAuthResponse = (event: MessageEvent) => {
            if (event.data.type === "auth_success") {
              window.removeEventListener("message", handleAuthResponse)
              resolve(event.data)
            } else if (event.data.type === "auth_error") {
              window.removeEventListener("message", handleAuthResponse)
              reject(new Error(event.data.error))
            }
          }

          window.addEventListener("message", handleAuthResponse)

          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleAuthResponse)
            reject(new Error("Authentication timeout"))
          }, 30000)
        })
      } else {
        // Try Warpcast Connect for web
        console.log("🌐 Attempting Warpcast Connect authentication")

        // Check if Warpcast Connect is available
        if (typeof window !== "undefined" && (window as any).warpcast) {
          const result = await (window as any).warpcast.requestAuth()

          if (result.success) {
            const realUser: FarcasterUser = {
              fid: result.user.fid,
              username: result.user.username,
              displayName: result.user.displayName,
              pfpUrl: result.user.pfpUrl || "/placeholder-user.jpg",
              bio: result.user.bio,
              followerCount: result.user.followerCount,
              followingCount: result.user.followingCount,
              verifications: result.user.verifications || [],
              sessionToken: result.sessionToken,
            }

            setUser(realUser)
            setAuthType("real")

            // Save auth data
            const authData = {
              user: realUser,
              sessionToken: result.sessionToken,
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
              timestamp: Date.now(),
            }
            localStorage.setItem("farcaster-auth", JSON.stringify(authData))

            return
          }
        }

        // Fallback: Show instructions or redirect to Warpcast
        throw new Error("Please open this app from within Warpcast for full functionality")
      }
    } catch (err) {
      console.error("Authentication failed:", err)
      setError(err instanceof Error ? err.message : "Authentication failed")

      // Fallback to demo mode
      await createDemoUser()
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
