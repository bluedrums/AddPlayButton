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
    // Check if we're in a Farcaster frame
    const checkFrameContext = () => {
      try {
        // Check if we're in an iframe
        const inIframe = window.self !== window.top
        setIsInFrame(inIframe)

        if (inIframe) {
          console.log("🖼️ Detected iframe context - setting up Farcaster SDK")

          // Initialize Farcaster SDK
          const initializeSDK = () => {
            // Check if Farcaster SDK is available
            if (typeof window !== "undefined" && (window as any).sdk) {
              const sdk = (window as any).sdk
              console.log("✅ Farcaster SDK found, calling ready()")

              // Call ready to dismiss splash screen
              if (sdk.actions && sdk.actions.ready) {
                sdk.actions.ready()
                setIsReady(true)
                console.log("🎉 SDK ready() called successfully")
              }

              // Get user context if available
              if (sdk.context && sdk.context.user) {
                setUser(sdk.context.user)
                console.log("👤 User context loaded:", sdk.context.user.username)
              }

              setIsSDKLoaded(true)
            } else {
              // Fallback: Send ready message to parent frame
              console.log("📡 SDK not found, sending ready message to parent")
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
              setIsReady(true)
              setIsSDKLoaded(true)
            }
          }

          // Try to initialize immediately
          initializeSDK()

          // Also try after a short delay in case SDK loads asynchronously
          setTimeout(initializeSDK, 100)
          setTimeout(initializeSDK, 500)
          setTimeout(initializeSDK, 1000)

          // Listen for messages from parent
          const handleMessage = (event: MessageEvent) => {
            console.log("📨 Received message:", event.data)

            if (event.data.type === "frame_user_data") {
              setUser(event.data.user)
              console.log("👤 User data received from parent:", event.data.user)
            }

            if (event.data.type === "sdk_ready") {
              setIsSDKLoaded(true)
              setIsReady(true)
              console.log("✅ SDK ready confirmation received")
            }
          }

          window.addEventListener("message", handleMessage)
          return () => window.removeEventListener("message", handleMessage)
        } else {
          // Not in iframe, mark as ready
          console.log("🌐 Not in iframe, marking as ready")
          setIsSDKLoaded(true)
          setIsReady(true)
        }
      } catch (err) {
        console.error("Error checking frame context:", err)
        setError("Failed to initialize frame context")
        setIsSDKLoaded(true)
        setIsReady(true)
      }
    }

    // Initialize SDK
    const initSDK = async () => {
      try {
        // Small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Check frame context
        checkFrameContext()
      } catch (err) {
        console.error("Error initializing Farcaster SDK:", err)
        setError("Failed to initialize SDK")
        setIsSDKLoaded(true)
        setIsReady(true)
      }
    }

    initSDK()
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
