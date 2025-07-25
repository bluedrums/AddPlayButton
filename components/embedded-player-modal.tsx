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
            "fixed inset-0 z-50 flex items-center justify-center",
            isFullOverlay ? "bg-black/70" : "bg-transparent" // Opacity 0.7 background when in overlay mode
          )}
          onClick={isFullOverlay ? onClose : undefined} // Click outside to close in overlay mode
        >
          {/* Centered content wrapper */}
          <div
            className={cn(
              "relative bg-background p-6 rounded-lg shadow-lg",
              isFullOverlay ? "max-w-[90vw] max-h-[90vh] overflow-auto" : "w-full max-w-md max-h-[90vh]"
            )}
          >
            {/* Close button */}
            <Button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 p-0 text-white">
              <X className="w-6 h-6" />
            </Button>
            <Button onClick={toggleFullOverlay} className="absolute top-4 right-12 h-8 w-8 p-0 text-white">
              <Maximize2 className="w-6 h-6" />
            </Button>

            {/* Header - hidden in overlay mode */}
            {!isFullOverlay && (
              <div className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xl">
                      <div
                        className={`w-8 h-8 ${getPlatformColor(playButton.platform)} rounded-full flex items-center justify-center`}
                      >
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <span className="truncate">{playButton.title}</span>
                    </div>
                    <div className="mt-1">
                      {playButton.artist && <span className="text-gray-600">by {playButton.artist} • </span>}
                      <span>Playing on {playButton.platform}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={cn("space-y-4", isFullOverlay && "space-y-0")}>
              {/* Cast Success Alert - hidden in overlay mode */}
              {showCastSuccess && !isFullOverlay && (
                <Alert className="border-green-200 bg-green-50">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">🎉 Cast published successfully!</span>
                      {castUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-green-700 hover:text-green-800"
                          onClick={() => window.open(castUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View on Warpcast
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Player Info Card - hidden in overlay mode */}
              {!isFullOverlay && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      {/* Cover Image or Platform Icon */}
                      {playButton.coverImage ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={playButton.coverImage || "/placeholder.svg"}
                            alt={`${playButton.title} cover`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-16 h-16 ${getPlatformColor(playButton.platform)} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <Music className="w-8 h-8 text-white" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{playButton.title}</h3>
                        {playButton.artist && <p className="text-gray-600 truncate">{playButton.artist}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{playButton.platform}</Badge>
                          {playButton.coverImage && (
                            <Badge variant="secondary" className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Custom Cover
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={handleShare} className="w-full bg-transparent">
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full bg-transparent">
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* Embedded Player - centered and full focus */}
              <div className={cn(isFullOverlay ? "w-full aspect-video" : "aspect-video", "bg-gray-100 relative")}>
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

                {/* Player Controls Overlay */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white border-0"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(playButton.url, "_blank")}
                    className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white border-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Platform-specific Info - hidden in overlay mode */}
              {!isFullOverlay && (
                <div className="text-center text-sm text-gray-500">
                  <p>
                    Playing from {playButton.platform} •
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 ml-1 text-purple-600 hover:text-purple-700"
                      onClick={() => window.open(playButton.url, "_blank")}
                    >
                      Open in {playButton.platform}
                    </Button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
