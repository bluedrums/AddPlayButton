"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, ExternalLink, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
import { useFarcaster } from "@/components/farcaster-provider"

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
  trigger: React.ReactNode
}

export function CastComposer({ playButton, trigger }: CastComposerProps) {
  const { user } = useFarcaster()
  const [isOpen, setIsOpen] = useState(false)
  const [castText, setCastText] = useState(
    `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""}\n\nCheck out this ${playButton.platform} track!`,
  )

  const { createCast, isLoading, error, success } = useFarcasterCast()

  const handleSubmit = async () => {
    if (!user) return

    const miniappUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?playButton=${playButton.id}`

    const success = await createCast({
      text: castText,
      embeds: [
        {
          url: playButton.url,
        },
        {
          url: miniappUrl,
        },
      ],
    })

    if (success) {
      setTimeout(() => {
        setIsOpen(false)
        setCastText(
          `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""}\n\nCheck out this ${playButton.platform} track!`,
        )
      }, 2000)
    }
  }

  const characterCount = castText.length
  const maxCharacters = 320
  const isOverLimit = characterCount > maxCharacters

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Cast</DialogTitle>
          <DialogDescription>Share this play button with your Farcaster followers</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cast Text Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="cast-text" className="text-sm font-medium">
                Cast Text
              </label>
              <span className={`text-sm ${isOverLimit ? "text-red-500" : "text-gray-500"}`}>
                {characterCount}/{maxCharacters}
              </span>
            </div>
            <Textarea
              id="cast-text"
              value={castText}
              onChange={(e) => setCastText(e.target.value)}
              placeholder="What do you want to say about this track?"
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            {isOverLimit && (
              <p className="text-sm text-red-500">
                Cast text is too long. Please reduce by {characterCount - maxCharacters} characters.
              </p>
            )}
          </div>

          {/* Preview Card */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <Card className="border-2 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-semibold text-sm">
                      {user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{user?.displayName || user?.username || "You"}</span>
                      <span className="text-gray-500 text-sm">@{user?.username || "username"}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{castText}</p>

                    <Separator className="my-3" />

                    {/* Embedded Content Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 truncate">{playButton.url}</span>
                        <Badge variant="outline" className="text-xs">
                          {playButton.platform}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                        <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">▶</span>
                        </div>
                        <span className="text-sm text-purple-700">Interactive Play Button</span>
                        <Badge variant="secondary" className="text-xs">
                          Mini App
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Cast created successfully! It should appear in your timeline shortly.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isOverLimit || !castText.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? "Creating Cast..." : "Create Cast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
