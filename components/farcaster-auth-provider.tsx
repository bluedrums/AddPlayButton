"use client"

import { AuthKitProvider } from "@farcaster/auth-kit"
import type React from "react"

interface FarcasterAuthProviderProps {
  children: React.ReactNode
}

export function FarcasterAuthProvider({ children }: FarcasterAuthProviderProps) {
  // Only initialize if we should use real auth
  const shouldUseRealAuth =
    process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true" ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost")

  if (!shouldUseRealAuth) {
    // Return children without auth provider for mock mode
    return <>{children}</>
  }

  const config = {
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000",
    siweUri: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    rpcUrl: "https://mainnet.optimism.io",
    relay: "https://relay.farcaster.xyz",
  }

  console.log("🔧 Initializing Farcaster Auth Kit with config:", config)

  return <AuthKitProvider config={config}>{children}</AuthKitProvider>
}
