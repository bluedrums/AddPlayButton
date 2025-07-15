"use client"

import { useEffect, useState } from "react"
import { Play } from "lucide-react"

interface SplashScreenProps {
  onReady: () => void
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [readyCalled, setReadyCalled] = useState(false)

  useEffect(() => {
    console.log("🎬 Splash screen mounted")

    const callReadyMultipleTimes = () => {
      if (readyCalled) return
      setReadyCalled(true)
      console.log("🎯 SplashScreen: attempting sdk.actions.ready() ...")

      try {
        // Method 1 – Same-window SDK
        const sdk = (window as any).sdk || (window as any).farcaster
        if (sdk?.actions?.ready) {
          sdk.actions.ready()
          console.log("✅ Method 1 worked – called sdk.actions.ready()")
        }
      } catch (err) {
        console.error("SDK ready() error:", err)
      }

      // Method 2 – PostMessage (always allowed, even cross-origin)
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "frame_ready" }, "*")
          window.parent.postMessage({ type: "ready" }, "*")
          console.log("📡 Method 2 – posted frame_ready / ready to parent")
        }
      } catch (err) {
        console.error("postMessage error:", err)
      }
      // Method 3 – Global callbacks on *this* window only
      ;["frameReady", "ready", "farcasterReady", "miniAppReady"].forEach((fn) => {
        try {
          const cb = (window as any)[fn]
          if (typeof cb === "function") {
            cb()
            console.log(`🔧 Method 3 – called global ${fn}()`)
          }
        } catch (_) {}
      })

      // Method 4 – Custom events (same-window)
      window.dispatchEvent(new Event("farcaster_ready"))
      window.dispatchEvent(new Event("frame_ready"))
    }

    // Call ready immediately
    const immediateTimer = setTimeout(callReadyMultipleTimes, 100)

    // Call ready again after splash animation
    const splashTimer = setTimeout(() => {
      if (!readyCalled) {
        callReadyMultipleTimes()
      }

      // Hide splash screen
      setTimeout(() => {
        setIsVisible(false)
        onReady()
        console.log("✅ Splash screen dismissed, main app ready")
      }, 300)
    }, 1500)

    return () => {
      clearTimeout(immediateTimer)
      clearTimeout(splashTimer)
    }
  }, [onReady, readyCalled])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl animate-pulse">
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

        {/* Debug info */}
        <div className="mt-4 text-xs text-purple-200 opacity-75">Initializing Farcaster SDK...</div>
      </div>
    </div>
  )
}
