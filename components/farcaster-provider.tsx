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
  signOut: () => {},
  isSDKReady: false,
  setUser: () => {},
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

function FarcasterProviderContent({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, error, signOut, isSDKReady, setUser } = useFarcasterAuth();
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
    signOut,
    isSDKReady,
    setUser,
    error,
    playButtons,
    setPlayButtons,
  }

  return <FarcasterContext.Provider value={contextValue}>{children}</FarcasterContext.Provider>
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  return <FarcasterProviderContent>{children}</FarcasterProviderContent>;
}
