"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface FarcasterSDKContextType {
  isSDKLoaded: boolean
  isInFrame: boolean
  user: any | null
  error: string | null
}

const FarcasterSDKContext = createContext<FarcasterSDKContextType>({
  isSDKLoaded: false,
  isInFrame: false,
  user: null,
  error: null,
})

export function useFarcasterSDK() {
  return useContext(FarcasterSDKContext)
}

export function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isInFrame, setIsInFrame] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're in a Farcaster frame
    const checkFrameContext = () => {
      try {
        // Check if we're in an iframe
        const inIframe = window.self !== window.top
        setIsInFrame(inIframe)

        if (inIframe) {
          // Send ready message to parent frame
          window.parent.postMessage(
            {
              type: "frame_ready",
              data: {
                name: "Add Play Button",
                version: "1.0.0",
              },
            },
            "*",
          )

          // Listen for messages from parent
          const handleMessage = (event: MessageEvent) => {
            if (event.data.type === "frame_user_data") {
              setUser(event.data.user)
            }
          }

          window.addEventListener("message", handleMessage)
          return () => window.removeEventListener("message", handleMessage)
        }
      } catch (err) {
        console.error("Error checking frame context:", err)
        setError("Failed to initialize frame context")
      }
    }

    // Initialize SDK
    const initSDK = async () => {
      try {
        // Simulate SDK loading
        await new Promise((resolve) => setTimeout(resolve, 100))
        setIsSDKLoaded(true)

        // Check frame context
        checkFrameContext()
      } catch (err) {
        console.error("Error initializing Farcaster SDK:", err)
        setError("Failed to initialize SDK")
        setIsSDKLoaded(true) // Still mark as loaded to prevent infinite loading
      }
    }

    initSDK()
  }, [])

  const value = {
    isSDKLoaded,
    isInFrame,
    user,
    error,
  }

  return <FarcasterSDKContext.Provider value={value}>{children}</FarcasterSDKContext.Provider>
}
