"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, ExternalLink, Loader2, CheckCircle, AlertCircle, Info, Play, Settings } from "lucide-react"
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
  createdAt: Date
}

interface CastComposerProps {
  playButton: PlayButton
  trigger: React.ReactNode
}

export function CastComposer({ playButton, trigger }: CastComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [castText, setCastText] = useState("")
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const { createPlayButtonCast, isCreating, error, lastResponse, clearError } = useFarcasterCast()
  const { user, isAuthenticated, signIn } = useFarcaster()

  // Generate default cast text
  const defaultText = `�� ${playButton.title}`;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setCastText(defaultText)
      clearError()
      setShowDebugInfo(false)
    }
  }

  const handleCreateCast = async () => {
    if (!isAuthenticated) {
      await signIn();
      return;
    }
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const textToCast = castText && castText.trim().length > 0
        ? castText
        : `🎵 ${playButton.title}${playButton.artist ? ` by ${playButton.artist}` : ""}`;
      const miniappUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?fid=${user.fid}&playButton=${playButton.id}`;
      const embeds = [miniappUrl];
      // Fix: Pass correct arguments to createPlayButtonCast
      const result = await createPlayButtonCast({
        id: playButton.id,
        platform: playButton.platform,
        title: playButton.title,
        artist: playButton.artist,
        url: playButton.url,
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create cast:", err)
      toast.error("Failed to create cast")
      setShowDebugInfo(true)
      
    }
  }

  const characterCount = castText.length
  const isOverLimit = characterCount > 320

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Create Cast
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="ml-auto h-6 w-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Share this play button with your Farcaster followers
          </DialogDescription>
        </DialogHeader>

        {!lastResponse?.success ? (
          <div className="space-y-4">
            {/* User Info - Compact */}
            {user && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <img
                  src={user.pfpUrl || "/placeholder-user.jpg"}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-600 truncate">@{user.username}</p>
                </div>
                {user.fid === 12345 && (
                  <Badge variant="outline" className="text-xs">
                    Demo
                  </Badge>
                )}
              </div>
            )}

            {/* Cast Text Input - Compact */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="cast-text" className="text-sm font-medium">
                  Cast Text
                </label>
                <span className={`text-xs ${isOverLimit ? "text-red-500" : "text-gray-500"}`}>
                  {characterCount}/320
                </span>
              </div>
              <Textarea
                id="cast-text"
                value={castText}
                onChange={(e) => setCastText(e.target.value)}
                placeholder={defaultText}
                className="min-h-[80px] resize-none text-sm"
                maxLength={320}
                disabled={isCreating}
              />
              {isOverLimit && <p className="text-xs text-red-500">Character limit exceeded</p>}
            </div>

            {/* Play Button Preview - Scrollable */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <ScrollArea className="w-full">
                <Card className="min-w-[300px] border-2 border-dashed">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold text-xs">
                          {user?.displayName?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{user?.displayName || "You"}</span>
                          <span className="text-gray-500 text-xs truncate">@{user?.username || "username"}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words mb-2">{castText || defaultText}</p>

                        <Separator className="my-2" />

                        {/* Embedded Content Preview */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                            <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600 truncate">{playButton.platform}</span>
                            <Badge variant="outline" className="text-xs">
                              Music
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded text-xs">
                            <Play className="w-3 h-3 text-purple-600 flex-shrink-0" />
                            <span className="text-purple-700 truncate">Interactive Play Button</span>
                            <Badge variant="secondary" className="text-xs">
                              Mini App
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </div>

            {/* Error Display with Debug Info */}
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="font-medium mb-1">Authentication failed</div>
                  <div className="text-xs opacity-90">
                    Cast failed – try again or check console.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Debug Information */}
            {showDebugInfo && lastResponse && (
              <Alert className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <div className="font-medium mb-1">Debug Information:</div>
                  <div className="space-y-1 font-mono">
                    <div>Status: {lastResponse.success ? "Success" : "Failed"}</div>
                    <div>Error: {lastResponse.error || "None"}</div>
                    {lastResponse.details && (
                      <div>Details: {JSON.stringify(lastResponse.details, null, 2).substring(0, 200)}...</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Demo Mode Notice */}
            {user?.fid === 12345 && (
              <Alert className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Demo Mode:</strong> This will create a simulated cast. Configure WARPCAST_API_KEY for real
                  casting.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreateCast}
                disabled={isCreating || isOverLimit || !castText.trim()}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Cast
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {lastResponse.isDemo ? "Demo Cast Created!" : "Cast Published!"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {lastResponse.isDemo
                  ? "Demo cast created (not published to timeline)"
                  : "Your cast has been posted to Farcaster"}
              </p>
            </div>

            <div className="flex gap-2">
              {lastResponse.warpcastUrl && !lastResponse.isDemo && (
                <Button
                  variant="outline"
                  onClick={() => window.open(lastResponse.warpcastUrl, "_blank")}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View
                </Button>
              )}
              <Button onClick={() => setIsOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
