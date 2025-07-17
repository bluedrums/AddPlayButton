"use client"

import { useState, useEffect, useCallback } from "react"
import type { FarcasterUser } from "@/lib/farcaster"

interface AuthState {
  user: FarcasterUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  authType: "real" | "demo"
  canUpgradeToReal: boolean
}

export function useFarcasterAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    authType: "demo",
    canUpgradeToReal: true,
  })

  // Initialize auth on mount - always start with demo mode for immediate functionality
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Check if we have saved auth data
      const savedAuth = localStorage.getItem("farcaster-auth")
      if (savedAuth) {
        const authData = JSON.parse(savedAuth)
        if (authData.user && authData.authType) {
          setAuthState({
            user: authData.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
            authType: authData.authType,
            canUpgradeToReal: authData.authType === "demo",
          })
          return
        }
      }

      // No saved auth, create demo user immediately
      await createDemoUser()
    } catch (error) {
      console.error("Auth initialization error:", error)
      // Even if there's an error, create demo user as fallback
      await createDemoUser()
    }
  }

  const createDemoUser = async () => {
    // Create a demo user immediately for seamless experience
    const demoUser: FarcasterUser = {
      fid: 12345,
      username: "demo_user",
      displayName: "Demo User",
      pfpUrl: "/placeholder-user.jpg",
      custodyAddress: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6",
      verifications: [],
    }

    const authData = {
      user: demoUser,
      authType: "demo",
      timestamp: Date.now(),
    }

    localStorage.setItem("farcaster-auth", JSON.stringify(authData))

    setAuthState({
      user: demoUser,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      authType: "demo",
      canUpgradeToReal: true,
    })
  }

  const signIn = async () => {
    // This is now only used for upgrading to real auth
    return upgradeToRealAuth()
  }

  const upgradeToRealAuth = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check if we're in an environment that supports real auth
      const canUseRealAuth =
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true"

      if (!canUseRealAuth) {
        throw new Error("Real Farcaster auth not available in this environment")
      }

      // Try to use real Farcaster Auth Kit
      const { AuthKitProvider, SignInButton, useProfile } = await import("@farcaster/auth-kit")

      // This would be the real auth implementation
      // For now, we'll simulate it failing and staying in demo mode
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Real auth not configured"))
        }, 3000)
      })
    } catch (error: any) {
      console.error("Real auth upgrade failed:", error)

      // Stay in demo mode but show error
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Real Farcaster auth not available. Continuing in demo mode.",
        authType: "demo",
        canUpgradeToReal: false, // Don't show upgrade option again for this session
      }))

      // Clear error after 5 seconds
      setTimeout(() => {
        setAuthState((prev) => ({ ...prev, error: null }))
      }, 5000)
    }
  }

  const signOut = useCallback(() => {
    localStorage.removeItem("farcaster-auth")

    // Reset to demo mode instead of signing out completely
    createDemoUser()
  }, [])

  const useDemoMode = useCallback(() => {
    createDemoUser()
  }, [])

  return {
    ...authState,
    signIn,
    signOut,
    upgradeToRealAuth,
    useDemoMode,
  }
}
