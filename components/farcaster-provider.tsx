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
  setUser: (user: FarcasterUser) => void
  setError: (error: string | null) => void
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
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
  const [user, setUserState] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSDKReady, setIsSDKReady] = useState(false)

  const isAuthenticated = !!user

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready()
        setIsSDKReady(true)

        try {
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

            setUserState(userData)
            setError(null)
          } else {
            console.log("No user context available")
          }
        } catch (contextError) {
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

        setUserState(userData)
        setError(null)
      } else {
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

        setUserState(demoUser)
        setError(null)

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
    setUserState(user)
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setUserState(null)
    }
  }

  const contextValue: FarcasterContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    isSDKReady,
    setUser,
    error,
    setError,
  }

  return <FarcasterContext.Provider value={contextValue}>{children}</FarcasterContext.Provider>
}
