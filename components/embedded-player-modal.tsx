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
}

export function EmbeddedPlayerModal({
  isOpen,
  onClose,
  playButton,
  showCastSuccess = false,
  castUrl,
}: EmbeddedPlayerModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFullOverlay, setIsFullOverlay] = useState(false); // New state for full-overlay mode

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsMuted(false)
      setCopied(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setIsFullOverlay(true);
    } else {
      setIsFullOverlay(false);
    }
  }, [isOpen]);

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
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black", // Always have a black background
          )}
        >
          {/* Centered content wrapper */}
          <div
            className={cn(
              "relative w-full h-full" // Full width and height
            )}
          >
            {/* Close button */}
            <Button onClick={onClose} className="absolute top-2 right-2 h-8 w-8 p-0 text-white z-10 bg-black/30 hover:bg-black/50">
              <X className="w-6 h-6" />
            </Button>
            
            {/* Embedded Player - takes up the whole space */}
            <div className="w-full h-full">
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
