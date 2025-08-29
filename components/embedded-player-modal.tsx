"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  X,
  ExternalLink,
  Share,
  Copy,
  Check,
  Music,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ImageIcon,
  Sparkles,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useOrientation } from "@/hooks/use-orientation"

interface PlayButton {
  id: string
  url: string
  platform: string
  title: string
  artist?: string
  embedUrl: string
  coverImage?: string
  createdAt: Date
}

interface EmbeddedPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  playButton: PlayButton
  showCastSuccess?: boolean
  castUrl?: string
  safeArea?: { top: number; bottom: number; left: number; right: number };
}

export function EmbeddedPlayerModal({
  isOpen,
  onClose,
  playButton,
  showCastSuccess = false,
  castUrl,
  safeArea = { top: 0, bottom: 0, left: 0, right: 0 },
}: EmbeddedPlayerModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFullOverlay, setIsFullOverlay] = useState(false); // New state for full-overlay mode
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { orientation, isLandscape, isPortrait } = useOrientation()
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsMuted(false)
      setCopied(false)
      setIsFullscreen(false)
      // Exit fullscreen when modal closes
      if (isFullscreen) {
        handleExitFullscreen()
      }
    }
  }, [isOpen])

  // Show orientation change notification
  useEffect(() => {
    if (isOpen && orientation !== "unknown") {
      const message = isLandscape 
        ? "Switched to landscape mode - optimized for widescreen viewing"
        : "Switched to portrait mode - optimized for mobile viewing"
      toast.info(message, { duration: 2000 })
    }
  }, [orientation, isLandscape, isOpen])

  useEffect(() => {
    if (isOpen) {
      setIsFullOverlay(true);
    } else {
      setIsFullOverlay(false);
    }
  }, [isOpen]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        handleExitFullscreen()
      }
    }

    if (isOpen && isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, isFullscreen]);

  // Handle fullscreen functionality using native browser API
  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Request fullscreen on the modal container
        const modalElement = document.getElementById('player-modal-container')
        if (modalElement && modalElement.requestFullscreen) {
          await modalElement.requestFullscreen()
          setIsFullscreen(true)
          toast.success("Entered fullscreen mode")
        } else {
          toast.error("Fullscreen not supported")
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
          setIsFullscreen(false)
          toast.success("Exited fullscreen mode")
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
      toast.error("Fullscreen not available")
    }
  }

  const handleExitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error("Exit fullscreen error:", error)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    if (isOpen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      }
    }
  }, [isOpen])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${playButton.title} - ${playButton.platform}`,
          text: `Check out this ${playButton.platform} track: ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""}`,
          url: playButton.url,
        })
      } catch (error) {
        console.log("Share cancelled or failed:", error)
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(playButton.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Link copied to clipboard")
    } catch (error) {
      console.error("Failed to copy link:", error)
      toast.error("Failed to copy link")
    }
  }

  const toggleFullOverlay = () => {
    setIsFullOverlay(!isFullOverlay);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "spotify":
        return "bg-green-500"
      case "apple music":
        return "bg-gray-800"
      case "youtube":
        return "bg-red-500"
      case "soundcloud":
        return "bg-orange-500"
      default:
        return "bg-purple-500"
    }
  }

  // Get orientation-specific styles
  const getOrientationStyles = () => {
    if (isLandscape) {
      return {
        container: "landscape-mode",
        controls: "landscape-controls",
        player: "landscape-player"
      }
    }
    return {
      container: "portrait-mode",
      controls: "portrait-controls", 
      player: "portrait-player"
    }
  }

  // Handle orientation change with user feedback
  const handleOrientationChange = () => {
    if (orientation !== "unknown") {
      const message = isLandscape 
        ? "🎬 Switched to landscape mode - optimized for widescreen viewing"
        : "📱 Switched to portrait mode - optimized for mobile viewing"
      toast.info(message, { 
        duration: 2000,
        position: "top-center"
      })
    }
  }

  // Call orientation change handler when orientation changes
  useEffect(() => {
    if (isOpen) {
      handleOrientationChange()
    }
  }, [orientation, isOpen])

  // Mobile-specific optimizations
  useEffect(() => {
    if (isOpen && isMobile) {
      // Suggest landscape orientation for better video viewing on mobile
      const message = "📱 Tip: Rotate your device to landscape for the best viewing experience"
      toast.info(message, { 
        duration: 4000,
        position: "bottom-center"
      })
    }
  }, [isOpen, isMobile])

  // Handle mobile-specific layout adjustments
  const getMobileLayoutClass = () => {
    if (!isMobile) return ""
    
    if (isLandscape) {
      return "mobile-landscape"
    } else {
      return "mobile-portrait"
    }
  }

  return (
    <>
      {isOpen && (
        <div
          id="player-modal-container"
          className={cn(
            "fixed inset-0 z-50 bg-black transition-all duration-300 ease-in-out", // Always have a black background
            isLandscape ? "landscape-layout" : "portrait-layout",
            getMobileLayoutClass()
          )}
        >
          {/* Centered content wrapper */}
          <div
            className={cn(
              "relative w-full h-full transition-all duration-300 ease-in-out",
              isLandscape ? "landscape-content" : "portrait-content"
            )}
            style={{
              marginTop: `${safeArea.top}px`,
              marginBottom: `${safeArea.bottom + 10}px`,
              marginLeft: `${safeArea.left}px`,
              marginRight: `${safeArea.right}px`,
              padding: isLandscape ? "0" : "0",
            }}
          >
            {/* Control buttons - responsive to orientation */}
            <div className={cn(
              "absolute z-10 flex gap-2",
              isLandscape 
                ? "top-2 right-2" // Landscape: top-right corner
                : "top-2 left-1/2 transform -translate-x-1/2" // Portrait: centered top
            )}>
              {/* Orientation indicator */}
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 bg-black/30 rounded-md text-white backdrop-blur-sm transition-all duration-200",
                isMobile ? "text-sm px-3 py-2" : "text-xs px-2 py-1"
              )}>
                <RotateCcw className={cn(
                  isMobile ? "w-4 h-4" : "w-3 h-3"
                )} />
                {orientation === "landscape" ? "Landscape" : "Portrait"}
              </div>
              
              {/* Close button */}
              <Button 
                onClick={onClose} 
                className={cn(
                  "text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all duration-200",
                  isLandscape 
                    ? isMobile ? "h-10 w-10 p-0" : "h-8 w-8 p-0"
                    : isMobile ? "h-12 w-12 p-0" : "h-10 w-10 p-0" // Larger touch target on mobile portrait
                )}
              >
                <X className={cn(
                  isLandscape 
                    ? isMobile ? "w-7 h-7" : "w-6 h-6"
                    : isMobile ? "w-8 h-8" : "w-7 h-7" // Larger icon on mobile
                )} />
              </Button>
            </div>
            
            {/* Embedded Player - responsive to orientation */}
            <div className={cn(
              "w-full transition-all duration-300 ease-in-out",
              isLandscape 
                ? "h-full flex items-center justify-center" // Landscape: center content
                : "h-full flex flex-col items-center justify-center" // Portrait: stack content
            )} style={{ 
              height: isLandscape ? '100%' : '98%',
              padding: isLandscape ? '0' : '0'
            }}>
              <iframe
                src={playButton.embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className={cn(
                  "w-full transition-all duration-300 ease-in-out shadow-2xl",
                  isLandscape 
                    ? "h-full rounded-none max-w-none" // Landscape: no rounded corners, full size
                    : "h-full rounded-xl max-w-full" // Portrait: rounded corners, constrained width
                )}
                title={`${playButton.title} - ${playButton.platform} Player`}
                style={{
                  minHeight: isLandscape ? '100vh' : 'auto',
                  aspectRatio: isLandscape ? '16/9' : 'auto',
                  maxWidth: isLandscape ? 'none' : isMobile ? '98vw' : '95vw',
                  maxHeight: isLandscape ? '100vh' : isMobile ? '95vh' : '90vh',
                  touchAction: 'manipulation', // Optimize for touch
                  WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
