"use client"

import { useState, useEffect } from "react"
import { useSignIn, useProfile } from "@farcaster/auth-kit"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  custodyAddress?: string
  verifications?: string[]
}

interface AuthState {
  user: FarcasterUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useFarcasterAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  // Check if we should use real auth
  const shouldUseRealAuth = () => {
    return (
      process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true" ||
      (typeof window !== "undefined" && window.location.hostname !== "localhost")
    )
  }

  // Farcaster Auth Kit hooks - only use if real auth is enabled
  const authKitEnabled = shouldUseRealAuth()

  console.log("🔧 Auth Kit Configuration:", {
    authKitEnabled,
    forceRealAuth: process.env.NEXT_PUBLIC_FORCE_REAL_AUTH,
    hostname: typeof window !== "undefined" ? window.location.hostname : "N/A",
    appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  })

  const signInHook = useSignIn({
    onSuccess: (data) => {
      console.log("✅ Auth Kit sign-in successful:", data)
      setAuthState((prev) => ({ ...prev, isLoading: false, error: null }))
    },
    onError: (error) => {
      console.error("❌ Auth Kit sign-in error:", error)
      setAuthState((prev) => ({
        ...prev,
        error: error.message || "Authentication failed",
        isLoading: false,
      }))
    },
    onStatusResponse: (res) => {
      console.log("📡 Auth Kit status response:", res)
    },
  })

  const profileHook = useProfile({
    fid: signInHook.data?.fid,
  })

  // Check for existing auth on mount
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const savedUser = localStorage.getItem("farcaster-user")
        const savedAuth = localStorage.getItem("farcaster-auth")

        if (savedUser && savedAuth) {
          const user = JSON.parse(savedUser)
          const authData = JSON.parse(savedAuth)

          // Check if auth is still valid (24 hours)
          const authAge = Date.now() - authData.timestamp
          const maxAge = 24 * 60 * 60 * 1000 // 24 hours

          if (authAge < maxAge) {
            console.log("🔄 Restored existing auth for user:", user.username)
            setAuthState({
              user,
              isLoading: false,
              isAuthenticated: true,
              error: null,
            })
            return
          }
        }

        // Clear expired auth
        localStorage.removeItem("farcaster-user")
        localStorage.removeItem("farcaster-auth")
      } catch (error) {
        console.error("Error checking existing auth:", error)
      }

      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }

    checkExistingAuth()
  }, [])

  // Handle successful auth kit sign-in
  useEffect(() => {
    if (authKitEnabled && signInHook.isSuccess && signInHook.data && profileHook.data) {
      console.log("✅ Processing Auth Kit success")

      const user: FarcasterUser = {
        fid: signInHook.data.fid,
        username: profileHook.data.username,
        displayName: profileHook.data.displayName,
        pfpUrl: profileHook.data.pfpUrl,
        custodyAddress: signInHook.data.custodyAddress,
        verifications: profileHook.data.verifications || [],
      }

      // Save auth data
      const authData = {
        timestamp: Date.now(),
        fid: signInHook.data.fid,
        custodyAddress: signInHook.data.custodyAddress,
        isRealAuth: true,
      }

      localStorage.setItem("farcaster-user", JSON.stringify(user))
      localStorage.setItem("farcaster-auth", JSON.stringify(authData))

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      })
    }
  }, [authKitEnabled, signInHook.isSuccess, signInHook.data, profileHook.data])

  // Monitor auth kit errors
  useEffect(() => {
    if (authKitEnabled && signInHook.error) {
      console.error("🚨 Auth Kit Error:", signInHook.error)
      setAuthState((prev) => ({
        ...prev,
        error: signInHook.error?.message || "Authentication failed",
        isLoading: false,
      }))
    }
  }, [authKitEnabled, signInHook.error])

  const signIn = async () => {
    console.log("🔐 Starting sign-in process...")
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      if (authKitEnabled) {
        console.log("🚀 Using real Farcaster Auth Kit")

        // Check if auth kit is available
        if (!signInHook.signIn) {
          throw new Error("Farcaster Auth Kit not properly initialized. Check your configuration.")
        }

        console.log("📱 Triggering Auth Kit sign-in...")

        // Add timeout handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Authentication timed out after 30 seconds"))
          }, 30000)
        })

        try {
          // Try to trigger the sign-in with timeout
          await Promise.race([signInHook.signIn(), timeoutPromise])
          console.log("📱 Auth Kit sign-in triggered successfully")
        } catch (error) {
          console.error("❌ Auth Kit sign-in failed:", error)
          throw error
        }
      } else {
        console.log("🎭 Using mock authentication")

        // Mock auth flow
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const mockUser: FarcasterUser = {
          fid: 1234,
          username: "demo",
          displayName: "Demo User",
          pfpUrl: "/placeholder.svg?height=64&width=64",
          custodyAddress: "0xDEMO",
          verifications: [],
        }

        const authData = {
          timestamp: Date.now(),
          fid: mockUser.fid,
          custodyAddress: mockUser.custodyAddress,
          isRealAuth: false,
        }

        localStorage.setItem("farcaster-user", JSON.stringify(mockUser))
        localStorage.setItem("farcaster-auth", JSON.stringify(authData))

        setAuthState({
          user: mockUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        })
      }
    } catch (error: any) {
      console.error("🚨 Sign in error:", error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error.message || "Failed to sign in",
      })
    }
  }

  const signOut = () => {
    console.log("👋 Signing out user")
    localStorage.removeItem("farcaster-user")
    localStorage.removeItem("farcaster-auth")

    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    })
  }

  // Update loading state based on auth kit status
  const isLoading = authState.isLoading || (authKitEnabled && (signInHook.isLoading || profileHook.isLoading))

  return {
    ...authState,
    isLoading,
    signIn,
    signOut,
    // Expose auth kit state for debugging
    authKitState: authKitEnabled
      ? {
          signInLoading: signInHook.isLoading,
          signInError: signInHook.error,
          signInData: signInHook.data,
          profileLoading: profileHook.isLoading,
          profileError: profileHook.error,
          profileData: profileHook.data,
        }
      : null,
  }
}
