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
  setUser: (user: FarcasterUser) => void;
  setError: (error: string | null) => void;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signIn: async () => {},
  signOut: () => {},
  isSDKReady: false,
  setUser: () => {},
  setError: () => {},
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

        // Check if we're in a Farcaster context and get user data
        try {
          // Try to get user context from the SDK
          const context = await sdk.context

          if (context?.user) {
            // User is already authenticated in the Mini App context
            const userData: FarcasterUser = {
              fid: context.user.fid,
              username: context.user.username || `user${context.user.fid}`,
              displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
              pfpUrl: context.user.pfpUrl || "/placeholder-user.jpg",
              bio: context.user.bio,
              followerCount: context.user.followerCount,
              followingCount: context.user.followingCount,
              verifications: context.user.verifications || [],
            }

            setUser(userData)
            setError(null)
          } else {
            // No user context available - user needs to authenticate
            console.log("No user context available")
          }
        } catch (contextError) {
          // No user context available, which is normal for unauthenticated users
          console.log("No user context:", contextError)
        }
      } catch (err) {
        console.error("SDK initialization error:", err)
        setError("Failed to initialize Farcaster SDK")
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
      // For Mini Apps, authentication is typically handled by the parent frame
      // We can try to trigger the authentication flow

      // First, check if we can get user context after a brief delay
      // (sometimes the context becomes available after user interaction)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const context = await sdk.context

      if (context?.user) {
        const userData: FarcasterUser = {
          fid: context.user.fid,
          username: context.user.username || `user${context.user.fid}`,
          displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
          pfpUrl: context.user.pfpUrl || "/placeholder-user.jpg",
          bio: context.user.bio,
          followerCount: context.user.followerCount,
          followingCount: context.user.followingCount,
          verifications: context.user.verifications || [],
        }

        setUser(userData)
        setError(null)
      } else {
        // If no context is available, create a demo user for testing
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
        setError(null)

        // Show a message that this is demo mode
        console.log("Using demo user - real authentication not available in this context")
      }
    } catch (err) {
      console.error("Sign in error:", err)
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const setUser = (user: FarcasterUser) => {
    setIsAuthenticated(true);
    setUserState(user);
  };

  const signOut = () => {
    setUser(null)
    setError(null)
  }

  const contextValue: FarcasterContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    isSDKReady,
    setUser,
    setError,
  }

  return <FarcasterContext.Provider value={contextValue}>{children}</FarcasterContext.Provider>
}
