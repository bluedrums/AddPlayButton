"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
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
}

interface CastComposerProps {
  playButton: PlayButton
  trigger: React.ReactNode
}

export function CastComposer({ playButton, trigger }: CastComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [castText, setCastText] = useState("")
  const [castResult, setCastResult] = useState<any>(null)
  const { createPlayButtonCast, isCreating, error, clearError } = useFarcasterCast()
  const { user, isAuthenticated } = useFarcaster()

  // Generate default cast text
  const defaultText = `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""}`

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setCastText(defaultText)
      setCastResult(null)
      clearError()
    }
  }

  const handleCreateCast = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to create casts")
      return
    }

    try {
      const result = await createPlayButtonCast(playButton, castText || defaultText)
      setCastResult(result)

      if (result.success) {
        toast.success("Cast created successfully!")
      }
    } catch (err) {
      console.error("Failed to create cast:", err)
      toast.error("Failed to create cast")
    }
  }

  const characterCount = castText.length
  const isOverLimit = characterCount > 320

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Create Cast
          </DialogTitle>
        </DialogHeader>

        {!castResult ? (
          <div className="space-y-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={user.pfpUrl || "/placeholder-user.jpg"}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
              </div>
            )}

            {/* Cast Text Input */}
            <div className="space-y-2">
              <label htmlFor="cast-text" className="text-sm font-medium">
                Cast Text
              </label>
              <Textarea
                id="cast-text"
                value={castText}
                onChange={(e) => setCastText(e.target.value)}
                placeholder={defaultText}
                className="min-h-[100px] resize-none"
                maxLength={320}
              />
              <div className="flex justify-between items-center text-sm">
                <span className={`${isOverLimit ? "text-red-500" : "text-gray-500"}`}>
                  {characterCount}/320 characters
                </span>
                {isOverLimit && <span className="text-red-500">Character limit exceeded</span>}
              </div>
            </div>

            {/* Play Button Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Embedded Content</label>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {playButton.coverImage && (
                      <img
                        src={playButton.coverImage || "/placeholder.svg"}
                        alt={playButton.title}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{playButton.title}</h4>
                      {playButton.artist && <p className="text-sm text-gray-600 truncate">{playButton.artist}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {playButton.platform}
                        </Badge>
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

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCast}
                disabled={isCreating || isOverLimit || !castText.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Cast...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create Cast
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Success/Result State */
          <div className="space-y-4">
            {castResult.success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Cast Created Successfully!</h3>
                  <p className="text-sm text-gray-600 mt-1">Your cast has been posted to your Farcaster timeline</p>
                </div>

                {castResult.warpcastUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(castResult.warpcastUrl, "_blank")}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Warpcast
                  </Button>
                )}

                <Button onClick={() => setIsOpen(false)} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="w-16 h-16 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-700">Cast Failed</h3>
                  <p className="text-sm text-gray-600 mt-1">{castResult.error || "Unknown error occurred"}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCastResult(null)} className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={() => setIsOpen(false)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
