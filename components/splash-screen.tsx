"use client"

import { useEffect, useState } from "react"
import { Play } from "lucide-react"

interface SplashScreenProps {
  onReady: () => void
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    console.log("🎬 Splash screen mounted")

    // Call ready after a short delay to ensure the splash is visible
    const timer = setTimeout(() => {
      console.log("🎯 Calling ready() from splash screen")

      // Try multiple methods to call ready
      try {
        // Method 1: Farcaster SDK
        if (typeof window !== "undefined") {
          const sdk = (window as any).sdk || (window as any).farcaster || (window as any).parent?.sdk

          if (sdk && sdk.actions && typeof sdk.actions.ready === "function") {
            console.log("✅ Found Farcaster SDK, calling ready()")
            sdk.actions.ready()
          } else {
            console.log("📡 SDK not found, posting message to parent")
            // Method 2: Post message to parent
            if (window.parent && window.parent !== window) {
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
          }

          // Method 3: Try global ready function
          if ((window as any).frameReady && typeof (window as any).frameReady === "function") {
            console.log("🔧 Calling global frameReady()")
            ;(window as any).frameReady()
          }
        }
      } catch (error) {
        console.error("❌ Error calling ready():", error)
      }

      // Hide splash screen and show main app
      setTimeout(() => {
        setIsVisible(false)
        onReady()
        console.log("✅ Splash screen dismissed, main app ready")
      }, 500)
    }, 1000) // Show splash for 1 second

    return () => clearTimeout(timer)
  }, [onReady])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
          <Play className="w-12 h-12 text-purple-600" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-white mb-2">Add Play Button</h1>
        <p className="text-purple-100 text-lg">Farcaster Mini App</p>

        {/* Loading Animation */}
        <div className="mt-8">
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
