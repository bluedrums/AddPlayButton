"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface FarcasterSDKContextType {
  isSDKLoaded: boolean
  isReady: boolean
  sdk: any
}

const FarcasterSDKContext = createContext<FarcasterSDKContextType>({
  isSDKLoaded: false,
  isReady: false,
  sdk: null,
})

export function useFarcasterSDK() {
  return useContext(FarcasterSDKContext)
}

export function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [sdk, setSdk] = useState<any>(null)

  useEffect(() => {
    console.log("🔧 FarcasterSDKProvider initializing...")

    // Check if SDK is already available
    const checkSDK = () => {
      if (typeof window !== "undefined") {
        const farcasterSDK = (window as any).sdk || (window as any).farcaster
        if (farcasterSDK) {
          console.log("✅ Farcaster SDK found")
          setSdk(farcasterSDK)
          setIsSDKLoaded(true)
          setIsReady(true)
          return true
        }
      }
      return false
    }

    // Try to find SDK immediately
    if (checkSDK()) {
      return
    }

    // If not found, wait for it to load
    const checkInterval = setInterval(() => {
      if (checkSDK()) {
        clearInterval(checkInterval)
      }
    }, 100)

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval)
      console.log("⚠️ Farcaster SDK not found after 5 seconds, continuing without it")
      setIsSDKLoaded(true)
      setIsReady(true)
    }, 5000)

    return () => {
      clearInterval(checkInterval)
      clearTimeout(timeout)
    }
  }, [])

  const value = {
    isSDKLoaded,
    isReady,
    sdk,
  }

  return <FarcasterSDKContext.Provider value={value}>{children}</FarcasterSDKContext.Provider>
}
