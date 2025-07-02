"use client"

import { AuthKitProvider } from "@farcaster/auth-kit"
import type React from "react"

interface FarcasterAuthProviderProps {
  children: React.ReactNode
}

export function FarcasterAuthProvider({ children }: FarcasterAuthProviderProps) {
  /* ------------------------------------------------------------------
   * Ensure the provider only runs in the browser
   * ------------------------------------------------------------------ */
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    // Runs once after mount
    setIsClient(true)
  }, [])

  // During SSR ‑or- before the component hydrates, just render children.
  if (!isClient) {
    return <>{children}</>
  }

  // Only initialize if we should use real auth
  const shouldUseRealAuth =
    process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true" ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost")

  if (!shouldUseRealAuth) {
    console.log("🎭 Auth Kit disabled - using mock mode")
    return <>{children}</>
  }

  /* ------------------------------------------------------------------
   * Utility: safely grab location pieces (avoids SSR ReferenceError)
   * ------------------------------------------------------------------ */
  const getLocationParts = () => {
    if (typeof window === "undefined") {
      return { hostname: "", origin: "", protocol: "https:" }
    }
    const { hostname, origin, protocol } = window.location
    return { hostname, origin, protocol }
  }

  const { hostname: actualHostname, origin: actualOrigin, protocol } = getLocationParts()

  /* ------------------------------------------------------------------
   * Determine domain / siweUri for Auth Kit
   *
   * Rules:
   * 1. If we’re in the browser **and** the current hostname is included
   *    in NEXT_PUBLIC_ALLOWED_DOMAINS (plus the primary APP_DOMAIN),
   *    use the browser’s hostname/origin so it matches exactly.
   * 2. Otherwise (SSR or non-allowed domain) fall back to env vars.
   * ------------------------------------------------------------------ */

  // Build list of allowed domains from env (comma-separated) + primary domain
  const allowedDomainsEnv =
    process.env.NEXT_PUBLIC_ALLOWED_DOMAINS?.split(",").map((d) => d.trim()) ?? []
  const primaryDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "addplaybutton.xyz"
  const allowedDomains = Array.from(new Set([primaryDomain, ...allowedDomainsEnv]))

  const domain =
    typeof window !== "undefined" && allowedDomains.includes(actualHostname)
      ? actualHostname
      : primaryDomain

  const siweUri =
    typeof window !== "undefined" && allowedDomains.includes(actualHostname)
      ? actualOrigin
      : process.env.NEXT_PUBLIC_APP_URL || "https://www.addplaybutton.xyz"

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

  /* ------------------------------------------------------------------
   * Additional domain / protocol validation & warnings
   * ------------------------------------------------------------------ */

  if (shouldUseRealAuth && actualHostname && !allowedDomains.includes(actualHostname)) {
    console.warn("⚠️ Current hostname is NOT in allowed domains list for Auth Kit:", {
      actualHostname,
      allowedDomains,
    })
  }

  if (shouldUseRealAuth && domain !== actualHostname && allowedDomains.includes(actualHostname)) {
    console.warn("⚠️ Configured domain differs from current hostname – this may break SIWE:", {
      configuredDomain: domain,
      actualHostname,
    })
  }

  if (shouldUseRealAuth && protocol !== "https:" && actualHostname !== "localhost") {
    console.warn("⚠️ Insecure protocol detected. Farcaster authentication requires HTTPS in production.", {
      protocol,
      hostname: actualHostname,
    })
  }

  // Special warning for production domain mismatch
  if (shouldUseRealAuth && actualHostname === "addplaybutton.xyz" && domain !== "addplaybutton.xyz") {
    console.error(
      "🚨 Production domain mismatch! Auth may fail because NEXT_PUBLIC_APP_DOMAIN is not set to addplaybutton.xyz",
    )
  }

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
