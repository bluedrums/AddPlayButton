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
  refreshPlayButtons: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => void
  setUser: (user: FarcasterUser | null) => void;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  playButtons: [],
  setPlayButtons: () => {},
  refreshPlayButtons: async () => {},
  signIn: async () => {},
  signOut: () => {},
  setUser: () => {},
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

function FarcasterProviderContent({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, error, signIn, signOut, setUser } = useFarcasterAuth();
  const [playButtons, setPlayButtons] = useState<PlayButton[]>([])

  const refreshPlayButtons = async () => {
    if (isAuthenticated && user) {
      // Add a small delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        console.log('🔄 Refreshing play buttons for user:', user.fid);
        const res = await api('/api/playbutton/all', {
          method: 'GET',
        });
        console.log('📊 Raw API response:', res);
        if (res) {
          const parsed = res.map((pb: any) => ({
            ...pb,
            createdAt: new Date(pb.createdAt),
          }));
          console.log('✅ Refreshed play buttons:', parsed.length);
          console.log('📋 Play button IDs:', parsed.map((pb: any) => pb.id));
          setPlayButtons(parsed);
        } else {
          console.log('⚠️ No response from API');
          setPlayButtons([]);
        }
      } catch (err) {
        console.error('Failed to refresh play buttons:', err);
        setPlayButtons([]);
      }
    } else {
      setPlayButtons([]);
    }
  };

  useEffect(() => {
    refreshPlayButtons();
  }, [isAuthenticated, user]);

  const contextValue: FarcasterContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    setUser,
    error,
    playButtons,
    setPlayButtons,
    refreshPlayButtons,
  }

  return <FarcasterContext.Provider value={contextValue}>{children}</FarcasterContext.Provider>
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  return <FarcasterProviderContent>{children}</FarcasterProviderContent>;
}
