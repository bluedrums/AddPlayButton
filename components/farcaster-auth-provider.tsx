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
    console.log("🎭 Auth Kit disabled - using mock mode")
    return <>{children}</>
  }

  const config = {
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000",
    siweUri: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    rpcUrl: "https://mainnet.optimism.io",
    relay: "https://relay.farcaster.xyz",
  }

  console.log("🔧 Initializing Farcaster Auth Kit with config:", config)

  // Validate required config
  if (!config.domain || !config.siweUri) {
    console.error("❌ Missing required Auth Kit configuration:", {
      domain: config.domain,
      siweUri: config.siweUri,
      envDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
      envUrl: process.env.NEXT_PUBLIC_APP_URL,
    })

    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-4">Missing required environment variables for Farcaster Auth Kit.</p>
          <div className="text-left text-sm text-gray-600 bg-gray-100 p-3 rounded">
            <p>Required:</p>
            <ul className="list-disc list-inside mt-2">
              <li>NEXT_PUBLIC_APP_DOMAIN</li>
              <li>NEXT_PUBLIC_APP_URL</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  try {
    return <AuthKitProvider config={config}>{children}</AuthKitProvider>
  } catch (error) {
    console.error("❌ Failed to initialize Auth Kit Provider:", error)

    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Auth Kit Error</h2>
          <p className="text-gray-700 mb-4">Failed to initialize Farcaster Auth Kit.</p>
          <div className="text-left text-sm text-gray-600 bg-gray-100 p-3 rounded">
            <p>Error: {error instanceof Error ? error.message : String(error)}</p>
          </div>
        </div>
      </div>
    )
  }
}
