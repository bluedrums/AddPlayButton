"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { FarcasterUser } from "@/lib/farcaster"
import { useFarcaster as useFarcasterAuth } from "@/hooks/use-farcaster"
import { api } from "@/lib/api"

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
  signIn: () => Promise<FarcasterUser | null>
  signOut: () => void
  isSDKReady: boolean
  setUser: (user: FarcasterUser | null) => void;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  playButtons: [],
  setPlayButtons: () => {},
  signIn: async () => null,
  signOut: () => {},
  isSDKReady: false,
  setUser: () => {},
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, error, signIn, signOut, isSDKReady, setUser } = useFarcasterAuth();
  const [playButtons, setPlayButtons] = useState<PlayButton[]>([])

  useEffect(() => {
    const fetchPlayButtons = async () => {
      if (isAuthenticated) {
        try {
          const res = await api('/api/playbutton/all');
          if (res) {
            const parsed = res.map((pb: any) => ({
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
        }
      } else {
        setPlayButtons([]);
      }
    };
    fetchPlayButtons();
  }, [isAuthenticated]);

  const contextValue: FarcasterContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    isSDKReady,
    setUser,
    error,
    playButtons,
    setPlayButtons,
  }

  return <FarcasterContext.Provider value={contextValue}>{children}</FarcasterContext.Provider>
}
