import { useState, useEffect } from "react"

export type Orientation = "portrait" | "landscape" | "unknown"

export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>("unknown")
  const [isLandscape, setIsLandscape] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    // Function to determine orientation
    const determineOrientation = () => {
      if (typeof window === "undefined") return

      const width = window.innerWidth
      const height = window.innerHeight
      
      if (width > height) {
        setOrientation("landscape")
        setIsLandscape(true)
        setIsPortrait(false)
      } else {
        setOrientation("portrait")
        setIsLandscape(false)
        setIsPortrait(true)
      }
    }

    // Initial orientation check
    determineOrientation()

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Use a small delay to ensure the window dimensions have updated
      setTimeout(determineOrientation, 100)
    }

    // Listen for resize events (which also catch orientation changes)
    const handleResize = () => {
      determineOrientation()
    }

    // Add event listeners
    window.addEventListener("orientationchange", handleOrientationChange)
    window.addEventListener("resize", handleResize)

    // For iOS Safari, also listen to the orientationchange event
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener("change", handleOrientationChange)
    }

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange)
      window.removeEventListener("resize", handleResize)
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener("change", handleOrientationChange)
      }
    }
  }, [])

  return {
    orientation,
    isLandscape,
    isPortrait,
  }
}