"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Play, MessageSquare, MoreVertical, ExternalLink, Copy, Trash2, Calendar, ImageIcon, Music } from "lucide-react"
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal"
import { useFarcaster } from "@/components/farcaster-provider"
import { toast } from "sonner"
import { sdk } from "@farcaster/miniapp-sdk"

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
  onRemove?: (id: string) => void
}

export function PlayButtonCard({ playButton, onRemove }: PlayButtonCardProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const { isAuthenticated, user } = useFarcaster()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playButton.url)
    toast.success("Link copied to clipboard!")
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(playButton.id)
      toast.success("Play button removed")
    }
  }

  const handleCast = async () => {
    if (!isAuthenticated || !user) {
      // should not happen if button is disabled, but good practice
      return;
    }

    try {
      let shareText = playButton.title;

      // Remove any existing "by <artist>" from title to avoid duplication
      if (playButton.artist && shareText.toLowerCase().includes(playButton.artist.toLowerCase())) {
        const regex = new RegExp(` by ${playButton.artist}`, 'i');
        shareText = shareText.replace(regex, '');
      }
      
      // Remove any existing "on <platform>" from title to avoid duplication
      const platformRegex = new RegExp(` on ${playButton.platform}`, 'i');
      shareText = shareText.replace(platformRegex, '');

      // Now, construct the clean share text
      if (playButton.artist) {
        shareText += ` by ${playButton.artist}`;
      }
      shareText += ` on ${playButton.platform}`;
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
      const frameUrl = `${appUrl}/share/${encodeURIComponent(playButton.id)}?fid=${user.fid}`;

      const { cast } = await sdk.actions.composeCast({ 
        text: shareText, 
        embeds: [frameUrl] 
      });

      if (cast) {
        toast.success('Cast composed successfully.');
      } else {
        toast.info('Cast composer closed.');
      }
    } catch (e) {
      console.error('Error composing cast', e);
      toast.error('Could not open composer.');
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Cover image - positioned top-left */}
            {playButton.coverImage ? (
              <img
                src={playButton.coverImage}
                alt={`${playButton.title} cover`}
                className="w-16 h-16 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                <Music className="w-8 h-8 text-purple-600" />
              </div>
            )}
            
            {/* Content area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate">{playButton.title}</h3>
                  {playButton.artist && <p className="text-gray-600 text-sm truncate mt-1">{playButton.artist}</p>}

                  {/* Play and Cast buttons directly under title/artist */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => setShowPlayer(true)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      size="sm"
                      disabled={!isAuthenticated}
                      title={!isAuthenticated ? "Sign in to create casts" : "Create a cast"}
                      onClick={handleCast}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Cast
                    </Button>
                  </div>
                </div>

                {/* More actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(playButton.url, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Original
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    {onRemove && (
                      <DropdownMenuItem onClick={handleRemove} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Badges and metadata */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="outline" className="text-xs">
              {playButton.platform}
            </Badge>
            {playButton.coverImage && (
              <Badge variant="secondary" className="text-xs">
                <ImageIcon className="w-3 h-3 mr-1" />
                Cover
              </Badge>
            )}
            <div className="flex items-center text-xs text-gray-500 ml-auto">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(playButton.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Player Modal */}
      <EmbeddedPlayerModal isOpen={showPlayer} onClose={() => setShowPlayer(false)} playButton={playButton} />
    </>
  )
}
