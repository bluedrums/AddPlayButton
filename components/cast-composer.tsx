"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Music,
  Loader2,
  ExternalLink,
  AlertCircle,
  Check,
  MessageSquare,
  X,
  Play,
  ImageIcon,
  Info,
} from "lucide-react"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
import { useFarcaster } from "@/components/farcaster-provider"
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal"
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

interface CastComposerProps {
  playButton: PlayButton
  trigger?: React.ReactNode
}

export function CastComposer({ playButton, trigger }: CastComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [castText, setCastText] = useState(
    `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""} on ${playButton.platform}`,
  )
  const [lastCreatedCast, setLastCreatedCast] = useState<any>(null)
  const [showPlayerModal, setShowPlayerModal] = useState(false)

  const { createPlayButtonCast, isCreating, error } = useFarcasterCast()
  const { user, isAuthenticated } = useFarcaster()

  const maxLength = 320
  const remainingChars = maxLength - castText.length

  const handleCreateCast = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to create a cast")
      return
    }

    if (castText.trim().length === 0) {
      toast.error("Cast text cannot be empty")
      return
    }

    if (castText.length > maxLength) {
      toast.error(`Cast text must be ${maxLength} characters or less`)
      return
    }

    try {
      const result = await createPlayButtonCast(playButton, castText.trim())

      if (result.success) {
        setLastCreatedCast(result)

        // Show different success messages for demo vs real casts
        if (result.isDemo) {
          toast.success("Demo cast created! (Real casting requires Warpcast API key)", {
            action: {
              label: "View Player",
              onClick: () => setShowPlayerModal(true),
            },
          })
        } else {
          toast.success("Cast published to your timeline!", {
            action: {
              label: "View on Warpcast",
              onClick: () => result.warpcastUrl && window.open(result.warpcastUrl, "_blank"),
            },
          })
        }

        // Auto-open the embedded player modal
        setTimeout(() => {
          setShowPlayerModal(true)
        }, 500)

        // Reset and close composer after a delay
        setTimeout(() => {
          setIsOpen(false)
          setCastText(
            `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""} on ${playButton.platform}`,
          )
        }, 1000)
      }
    } catch (error) {
      console.error("Failed to create cast:", error)
      toast.error("Failed to create cast. Please try again.")
    }
  }

  const handleReset = () => {
    setCastText(
      `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""} on ${playButton.platform}`,
    )
  }

  const defaultTrigger = (
    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
      <MessageSquare className="w-4 h-4 mr-2" />
      Create Cast
    </Button>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Create Cast
            </DialogTitle>
            <DialogDescription>Share this play button with your followers on Farcaster</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.displayName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {user.fid === 12345 ? "Demo Mode" : "Connected"}
                </Badge>
              </div>
            )}

            {/* Demo Mode Notice */}
            {user?.fid === 12345 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> This will create a simulated cast. To publish real casts to your timeline,
                  you need to configure the Warpcast API key in your environment variables.
                </AlertDescription>
              </Alert>
            )}

            {/* Cast Composer */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="cast-text" className="text-sm font-medium">
                    Cast Text
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${remainingChars < 0 ? "text-red-500" : remainingChars < 50 ? "text-orange-500" : "text-gray-500"}`}
                    >
                      {remainingChars} characters remaining
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="cast-text"
                  value={castText}
                  onChange={(e) => setCastText(e.target.value)}
                  placeholder="What's happening?"
                  className={`min-h-[100px] resize-none ${remainingChars < 0 ? "border-red-500" : ""}`}
                  disabled={isCreating}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Play Button Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Embedded Content</h4>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Cover Image Preview */}
                    {playButton.coverImage ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={playButton.coverImage || "/placeholder.svg"}
                          alt={`${playButton.title} cover`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-purple-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">{playButton.title}</h5>
                      {playButton.artist && <p className="text-sm text-gray-600 truncate">{playButton.artist}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {playButton.platform}
                        </Badge>
                        {playButton.coverImage && (
                          <Badge variant="secondary" className="text-xs">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Cover
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setShowPlayerModal(true)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(playButton.url, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Last Created Cast */}
            {lastCreatedCast && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-700">
                  {lastCreatedCast.isDemo ? "Demo Cast Created!" : "Cast Published Successfully!"}
                </h4>
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="flex items-center justify-between">
                      <span>
                        {lastCreatedCast.isDemo
                          ? "Demo cast created (not published to timeline)"
                          : "Your cast has been published to Farcaster!"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-green-700 hover:text-green-800"
                          onClick={() => setShowPlayerModal(true)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                        {lastCreatedCast.warpcastUrl && !lastCreatedCast.isDemo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-green-700 hover:text-green-800"
                            onClick={() => window.open(lastCreatedCast.warpcastUrl, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateCast}
                disabled={isCreating || !isAuthenticated || castText.trim().length === 0 || remainingChars < 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Cast...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {user?.fid === 12345 ? "Create Demo Cast" : "Create Cast"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Player Modal */}
      <EmbeddedPlayerModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        playButton={playButton}
        showCastSuccess={!!lastCreatedCast}
        castUrl={lastCreatedCast?.warpcastUrl}
      />
    </>
  )
}
