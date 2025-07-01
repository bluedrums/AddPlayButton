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

  // Get the actual hostname from the browser
  const actualHostname = typeof window !== "undefined" ? window.location.hostname : ""
  const actualOrigin = typeof window !== "undefined" ? window.location.origin : ""

  // Use the actual hostname if available, otherwise fall back to env vars
  const domain = actualHostname || process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000"
  const siweUri = actualOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const config = {
    domain,
    siweUri,
    rpcUrl: "https://mainnet.optimism.io",
    relay: "https://relay.farcaster.xyz",
  }

  console.log("🔧 Initializing Farcaster Auth Kit with config:", config)
  console.log("🌐 Domain matching check:", {
    configuredDomain: domain,
    actualHostname,
    configuredSiweUri: siweUri,
    actualOrigin,
    match: domain === actualHostname,
  })

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
