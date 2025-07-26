"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { FarcasterUser } from "@/lib/farcaster"
import { sdk } from "@farcaster/miniapp-sdk"

interface PlayButton {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist?: string;
  embedUrl: string;
  coverImage?: string;
  createdAt: Date;
}

interface FarcasterContextType {
  user: FarcasterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  playButtons: PlayButton[];
  setPlayButtons: (buttons: PlayButton[]) => void;
  signIn: () => Promise<void>
  signOut: () => void
  isSDKReady: boolean
  setUser: (user: FarcasterUser | null) => void;
  setError: (error: string | null) => void
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  playButtons: [],
  setPlayButtons: () => {},
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
  const [playButtons, setPlayButtons] = useState<PlayButton[]>([])

  const isAuthenticated = !!user

  // Effect 1: Initialize authentication state
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Check for an existing server-side session first
        const statusRes = await fetch('/api/auth/status', { credentials: 'include' });
        const statusData = await statusRes.json();

        if (statusData.isAuthenticated) {
          setUserState(statusData.user);
        } else {
          // If no session, try to authenticate with the Farcaster SDK
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

            // Create a new server-side session from the SDK context
            const sessionRes = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(userData),
            });

            if (sessionRes.ok) {
              const sessionData = await sessionRes.json();
              setUserState(sessionData.user); // Set user from the new session's response
            } else {
              setError("Failed to create a session.");
            }
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

  // Effect 2: Fetch user data when authentication state changes
  useEffect(() => {
    const fetchPlayButtons = async () => {
      if (isAuthenticated) {
        try {
          const res = await fetch('/api/playbutton/all', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            const parsed = data.map((pb: any) => ({
              ...pb,
              createdAt: new Date(pb.createdAt),
            }));
            setPlayButtons(parsed);
          } else {
            setPlayButtons([]);
            console.log('Could not fetch play buttons, maybe a new user?');
          }
        } catch (err) {
          console.error('Failed to fetch play buttons:', err);
          setError('Could not load your play buttons.');
        }
      } else {
        setPlayButtons([]); // Clear data if not authenticated
      }
    };

    fetchPlayButtons();
  }, [isAuthenticated]); // This effect depends on the authentication state

  const signIn = async () => {
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
      setUserState(null) // This will trigger the data-fetching useEffect to clear playButtons
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
    playButtons,
    setPlayButtons,
  }

  return <FarcasterContext.Provider value={contextValue}>{children}</FarcasterContext.Provider>
}
