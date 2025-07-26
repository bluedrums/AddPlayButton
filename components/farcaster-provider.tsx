"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { FarcasterUser } from "@/lib/farcaster"
import { sdk } from "@farcaster/miniapp-sdk"

interface FarcasterContextType {
  user: FarcasterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => void
  isSDKReady: boolean
  setUser: (user: FarcasterUser | null) => void
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
    const initialize = async () => {
      setIsLoading(true);
      try {
        // First, check for an existing server-side session
        const res = await fetch('/api/auth/status', { credentials: 'include' });
        const data = await res.json();

        if (data.isAuthenticated) {
          setUserState(data.user);
          setIsSDKReady(true); // Assume SDK is ready if authenticated
          return;
        }

        // If no session, initialize the SDK and check for Farcaster context
        await sdk.actions.ready();
        setIsSDKReady(true);
        
        const context = await sdk.context;
        if (context?.user) {
          const userData = {
            fid: context.user.fid,
            username: context.user.username || `user${context.user.fid}`,
            displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || "/placeholder-user.jpg",
          };

          // Create a server-side session from the SDK context
          const sessionRes = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (sessionRes.ok) {
            setUserState(userData);
          } else {
            setError("Failed to create a session.");
          }
        }
      } catch (err) {
        console.error("Initialization error:", err)
        setError("Failed to initialize.")
      } finally {
        setIsLoading(false)
      }
    }
    initialize()
  }, [])

  const signIn = async () => {
    // This can be used to trigger a manual sign-in flow if needed
    console.log("Sign in triggered");
  }

  const setUser = (user: FarcasterUser | null) => {
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
