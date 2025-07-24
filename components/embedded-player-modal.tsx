"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null); // New ref for DialogContent

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false)
      setIsMuted(false)
      setCopied(false)
    }
  }, [isOpen])

  // Sync isFullscreen state with browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await dialogRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${
          isFullscreen
            ? "fixed inset-0 p-0 m-0 flex items-center justify-center bg-black"
            : "max-w-4xl max-h-[90vh]"
        } overflow-hidden transition-all duration-300`}
      >
        <DialogHeader className={`${isFullscreen ? "hidden" : "pb-4"}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div
                  className={`w-8 h-8 ${getPlatformColor(playButton.platform)} rounded-full flex items-center justify-center`}
                >
                  <Music className="w-4 h-4 text-white" />
                </div>
                <span className="truncate">{playButton.title}</span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {playButton.artist && <span className="text-gray-600">by {playButton.artist} • </span>}
                <span>Playing on {playButton.platform}</span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className={`${isFullscreen ? "space-y-0 flex-1 flex items-center justify-center" : "space-y-4"}`}>
          {/* Cast Success Alert */}
          {showCastSuccess && (
            <Alert className={`${isFullscreen ? "hidden" : "border-green-200 bg-green-50"}`}>
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

          {/* Player Info Card */}
          <Card className={`${isFullscreen ? "hidden" : ""}`}>
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

          {/* Embedded Player */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className={`${
                  isFullscreen ? "w-full max-w-[90vw] aspect-video" : "aspect-video"
                } bg-gray-100 relative`}
              >
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white border-0"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform-specific Info */}
          <div className={`${isFullscreen ? "hidden" : "text-center text-sm text-gray-500"}`}>
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
        </div>

        {/* Close button for fullscreen mode */}
        {isFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
