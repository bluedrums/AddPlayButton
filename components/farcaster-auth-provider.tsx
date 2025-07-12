"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthKitProvider, useSignIn } from "@farcaster/auth-kit"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio?: string
  followerCount?: number
  followingCount?: number
}

interface FarcasterAuthContextType {
  user: FarcasterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => void
  signOut: () => void
  error: string | null
}

const FarcasterAuthContext = createContext<FarcasterAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: () => {},
  signOut: () => {},
  error: null,
})

export function useFarcasterAuth() {
  return useContext(FarcasterAuthContext)
}

function FarcasterAuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    signIn: authKitSignIn,
    isSuccess,
    isError,
    data: authData,
    isLoading: authLoading,
    error: authError,
  } = useSignIn()

  const isAuthenticated = !!user

  useEffect(() => {
    if (isSuccess && authData) {
      const userData: FarcasterUser = {
        fid: authData.fid,
        username: authData.username || "",
        displayName: authData.displayName || "",
        pfpUrl: authData.pfpUrl || "",
        bio: authData.bio,
        followerCount: authData.followerCount,
        followingCount: authData.followingCount,
      }
      setUser(userData)
      setError(null)
    }
  }, [isSuccess, authData])

  useEffect(() => {
    if (isError) {
      setError(authError?.message || "Authentication failed")
    }
  }, [isError, authError])

  useEffect(() => {
    setIsLoading(authLoading)
  }, [authLoading])

  const signIn = () => {
    setError(null)
    authKitSignIn()
  }

  const signOut = () => {
    setUser(null)
    setError(null)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    error,
  }

  return <FarcasterAuthContext.Provider value={value}>{children}</FarcasterAuthContext.Provider>
}

export function FarcasterAuthProvider({ children }: { children: React.ReactNode }) {
  const config = {
    rpcUrl: "https://mainnet.optimism.io",
    domain: "addplaybutton.xyz",
    siweUri: "https://addplaybutton.xyz",
  }

  return (
    <AuthKitProvider config={config}>
      <FarcasterAuthProviderInner>{children}</FarcasterAuthProviderInner>
    </AuthKitProvider>
  )
}
