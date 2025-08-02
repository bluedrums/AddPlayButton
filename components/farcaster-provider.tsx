"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { FarcasterUser } from "@/lib/farcaster"
import { useFarcaster as useFarcasterAuth } from "@/hooks/use-farcaster"
import { api } from "@/lib/api"
import { AuthKitProvider } from "@farcaster/auth-kit"
import type { AuthKitConfig } from "@farcaster/auth-kit"

// Build AuthKit configuration dynamically so the domain matches the environment (production, preview, local)
const buildAuthKitConfig = (): AuthKitConfig => {
  const defaultDomain = "www.addplaybutton.xyz";
  // Prefer the value from env, otherwise fall back to window location on the client, and finally the default.
  const domain =
    process.env.NEXT_PUBLIC_APP_DOMAIN ||
    (typeof window !== "undefined" ? window.location.hostname : undefined) ||
    defaultDomain;

  return {
    rpcUrl: "https://mainnet.optimism.io",
    domain,
    // `siweUri` should point to the base URL that will issue the SIWE message. Using the domain root is enough.
    siweUri: `https://${domain}`,
  };
};

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
  // Build the config on the client so we have access to `window.location`.
  const [config, setConfig] = useState<AuthKitConfig | null>(null);

  useEffect(() => {
    setConfig(buildAuthKitConfig());
  }, []);

  // While the config is not yet ready (first render on the client), we render nothing.
  if (!config) return null;

  return (
    <AuthKitProvider config={config}>
      <FarcasterProviderContent>{children}</FarcasterProviderContent>
    </AuthKitProvider>
  );
}
