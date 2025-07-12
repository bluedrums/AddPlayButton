"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, ExternalLink, Trash2, MessageSquare, MoreHorizontal, Share, ImageIcon, Play } from "lucide-react"
import { CastComposer } from "@/components/cast-composer"
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFarcaster } from "@/components/farcaster-provider"
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

interface PlayButtonCardProps {
  playButton: PlayButton
  onRemove: (id: string) => void
  onCopyLink: (playButton: PlayButton) => void
  copiedId: string | null
}

export function PlayButtonCard({ playButton, onRemove, onCopyLink, copiedId }: PlayButtonCardProps) {
  const { isAuthenticated } = useFarcaster()
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${playButton.title} - ${playButton.platform}`,
          text: `Check out this ${playButton.platform} track: ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""}`,
          url: playButton.url,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error)
      }
    } else {
      // Fallback to copying link
      onCopyLink(playButton)
    }
  }

  const handleCopyEmbedCode = async () => {
    const embedCode = `<iframe src="${playButton.embedUrl}" width="100%" height="152" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`

    try {
      await navigator.clipboard.writeText(embedCode)
      toast.success("Embed code copied to clipboard")
    } catch (error) {
      console.error("Failed to copy embed code:", error)
      toast.error("Failed to copy embed code")
    }
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex">
            {/* Cover Image */}
            {playButton.coverImage && (
              <div className="w-48 flex-shrink-0">
                <div className="aspect-[3/2] w-full">
                  <img
                    src={playButton.coverImage || "/placeholder.svg"}
                    alt={`${playButton.title} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
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
                    <span className="text-sm text-gray-500">{playButton.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Play Button - Primary Action */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPlayerModal(true)}
                    className="bg-white hover:bg-gray-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>

                  {/* Create Cast Button */}
                  {isAuthenticated && (
                    <CastComposer
                      playButton={playButton}
                      trigger={
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Cast
                        </Button>
                      }
                    />
                  )}

                  {/* More Actions Menu */}
                  <DropdownMenu open={isShareMenuOpen} onOpenChange={setIsShareMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onCopyLink(playButton)}>
                        {copiedId === playButton.id ? (
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
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handleCopyEmbedCode}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Embed Code
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => window.open(playButton.url, "_blank")}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Original
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handleShare}>
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onRemove(playButton.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Embedded Player Preview */}
              <div
                className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors relative group"
                onClick={() => setShowPlayerModal(true)}
              >
                <iframe
                  src={playButton.embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full h-full pointer-events-none"
                  title={`${playButton.title} - ${playButton.platform}`}
                />

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-800 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Player Modal */}
      <EmbeddedPlayerModal isOpen={showPlayerModal} onClose={() => setShowPlayerModal(false)} playButton={playButton} />
    </>
  )
}
