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
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  return (
    <>
      {isOpen && (
        <div
          id="player-modal-container"
          className={cn(
            "fixed inset-0 z-50 bg-black", // Always have a black background
          )}
        >
          {/* Centered content wrapper */}
          <div
            className="relative w-full h-full"
            style={{
              marginTop: `${safeArea.top}px`,
              marginBottom: `${safeArea.bottom + 10}px`,
              marginLeft: `${safeArea.left}px`,
              marginRight: `${safeArea.right}px`,
            }}
          >
            {/* Control buttons */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {/* Fullscreen button - disabled for now */}
{/*               <Button 
                onClick={handleFullscreen} 
                className="h-8 w-8 p-0 text-white bg-black/30 hover:bg-black/50"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button> */}
              
              {/* Close button */}
              <Button onClick={onClose} className="h-8 w-8 p-0 text-white bg-black/30 hover:bg-black/50">
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Embedded Player - takes up the whole space */}
            <div className="w-full h-full" style={{ height: '98%' }}>
              <iframe
                src={playButton.embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full h-full"
                title={`${playButton.title} - ${playButton.platform} Player`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
