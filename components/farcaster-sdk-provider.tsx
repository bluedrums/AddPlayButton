"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface FarcasterSDKContextType {
  isSDKLoaded: boolean
  isInFrame: boolean
  user: any | null
  error: string | null
  isReady: boolean
}

const FarcasterSDKContext = createContext<FarcasterSDKContextType>({
  isSDKLoaded: false,
  isInFrame: false,
  user: null,
  error: null,
  isReady: false,
})

export function useFarcasterSDK() {
  return useContext(FarcasterSDKContext)
}

export function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isInFrame, setIsInFrame] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let readyCalled = false

    const callReady = () => {
      if (readyCalled) return
      readyCalled = true

      console.log("🎯 Calling SDK ready...")

      // Method 1: Try Farcaster SDK
      if (typeof window !== "undefined") {
        try {
          // Check for various SDK patterns
          const sdk = (window as any).sdk || (window as any).farcaster || (window as any).parent?.sdk

          if (sdk && sdk.actions && typeof sdk.actions.ready === "function") {
            console.log("✅ Found Farcaster SDK, calling ready()")
            sdk.actions.ready()
            setIsReady(true)
            return
          }
        } catch (e) {
          console.log("❌ SDK ready() failed:", e)
        }

        // Method 2: Post message to parent
        try {
          if (window.parent && window.parent !== window) {
            console.log("📡 Posting ready message to parent")
            window.parent.postMessage(
              {
                type: "frame_ready",
                source: "farcaster_frame",
                data: {
                  name: "Add Play Button",
                  version: "1.0.0",
                },
              },
              "*",
            )
          }
        } catch (e) {
          console.log("❌ Parent message failed:", e)
        }

        // Method 3: Try global ready function
        try {
          if ((window as any).frameReady && typeof (window as any).frameReady === "function") {
            console.log("🔧 Calling global frameReady()")
            ;(window as any).frameReady()
          }
        } catch (e) {
          console.log("❌ Global frameReady failed:", e)
        }
      }

      // Always mark as ready after attempts
      setIsReady(true)
      console.log("✅ Marked as ready")
    }

    const initializeSDK = () => {
      try {
        // Check if we're in an iframe
        const inIframe = typeof window !== "undefined" && window.self !== window.top
        setIsInFrame(inIframe)

        console.log("🖼️ Frame context:", {
          inIframe,
          hasParent: typeof window !== "undefined" && window.parent !== window,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 50) : "N/A",
          referrer: typeof document !== "undefined" ? document.referrer.substring(0, 50) : "N/A",
        })

        // Call ready immediately
        callReady()

        // Also try after delays in case SDK loads asynchronously
        setTimeout(callReady, 100)
        setTimeout(callReady, 500)
        setTimeout(callReady, 1000)

        // Listen for messages from parent
        if (typeof window !== "undefined") {
          const handleMessage = (event: MessageEvent) => {
            console.log("📨 Received message:", event.data?.type)

            if (event.data?.type === "frame_user_data" && event.data?.user) {
              setUser(event.data.user)
              console.log("👤 User data received:", event.data.user.username)
            }

            if (event.data?.type === "sdk_ready") {
              setIsReady(true)
              console.log("✅ SDK ready confirmation received")
            }
          }

          window.addEventListener("message", handleMessage)

          // Cleanup
          return () => {
            window.removeEventListener("message", handleMessage)
          }
        }

        setIsSDKLoaded(true)
      } catch (err) {
        console.error("❌ SDK initialization error:", err)
        setError("Failed to initialize SDK")
        setIsSDKLoaded(true)
        setIsReady(true)
      }
    }

    // Initialize immediately
    initializeSDK()
  }, [])

  const value = {
    isSDKLoaded,
    isInFrame,
    user,
    error,
    isReady,
  }

  return <FarcasterSDKContext.Provider value={value}>{children}</FarcasterSDKContext.Provider>
}
