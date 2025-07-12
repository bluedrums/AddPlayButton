"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Music, Video, User, AlertCircle, Loader2, Settings, LogOut, Info } from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
import { PlayButtonCard } from "@/components/play-button-card"
import { toast } from "sonner"

interface PlayButton {
  id: string
  url: string
  platform: string
  title: string
  artist?: string
  embedUrl: string
  createdAt: Date
}

export default function AddPlayButtonApp() {
  const { user, isAuthenticated, isLoading, error: authError, signIn, signOut, isSDKReady } = useFarcaster()

  const { createPlayButtonCast, isCreating } = useFarcasterCast()

  const [url, setUrl] = useState("")
  const [playButtons, setPlayButtons] = useState<PlayButton[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Load saved play buttons from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("playButtons")
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((pb: any) => ({
          ...pb,
          createdAt: new Date(pb.createdAt),
        }))
        setPlayButtons(parsed)
      } catch (error) {
        console.error("Error loading saved play buttons:", error)
      }
    }
  }, [])

  const savePlayButtons = (buttons: PlayButton[]) => {
    localStorage.setItem("playButtons", JSON.stringify(buttons))
  }

  const detectPlatform = (url: string): { platform: string; embedUrl: string } | null => {
    const cleanUrl = url.trim()

    // Spotify
    if (cleanUrl.includes("spotify.com") || cleanUrl.includes("spoti.fi")) {
      const trackMatch = cleanUrl.match(/track\/([a-zA-Z0-9]+)/)
      const albumMatch = cleanUrl.match(/album\/([a-zA-Z0-9]+)/)
      const playlistMatch = cleanUrl.match(/playlist\/([a-zA-Z0-9]+)/)

      if (trackMatch) {
        return {
          platform: "Spotify",
          embedUrl: `https://open.spotify.com/embed/track/${trackMatch[1]}`,
        }
      } else if (albumMatch) {
        return {
          platform: "Spotify",
          embedUrl: `https://open.spotify.com/embed/album/${albumMatch[1]}`,
        }
      } else if (playlistMatch) {
        return {
          platform: "Spotify",
          embedUrl: `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`,
        }
      }
    }

    // Apple Music
    if (cleanUrl.includes("music.apple.com") || cleanUrl.includes("apple.co")) {
      return {
        platform: "Apple Music",
        embedUrl: cleanUrl.replace("music.apple.com", "embed.music.apple.com"),
      }
    }

    // YouTube
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      let videoId = ""

      if (cleanUrl.includes("youtu.be/")) {
        videoId = cleanUrl.split("youtu.be/")[1].split("?")[0]
      } else if (cleanUrl.includes("youtube.com/watch")) {
        const match = cleanUrl.match(/[?&]v=([^&]+)/)
        if (match) videoId = match[1]
      }

      if (videoId) {
        return {
          platform: "YouTube",
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        }
      }
    }

    // SoundCloud
    if (cleanUrl.includes("soundcloud.com")) {
      return {
        platform: "SoundCloud",
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`,
      }
    }

    return null
  }

  const validateUrl = async (url: string) => {
    setIsValidating(true)
    setValidationError("")

    try {
      const detection = detectPlatform(url)
      if (!detection) {
        throw new Error("Unsupported platform. Please use Spotify, Apple Music, YouTube, or SoundCloud links.")
      }

      // Simulate API validation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        platform: detection.platform,
        embedUrl: detection.embedUrl,
        title: `Sample ${detection.platform} Track`,
        artist: "Sample Artist",
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed"
      setValidationError(message)
      throw error
    } finally {
      setIsValidating(false)
    }
  }

  const handleAddPlayButton = async () => {
    if (!url.trim()) {
      setValidationError("Please enter a valid URL")
      return
    }

    try {
      const validated = await validateUrl(url)

      const newPlayButton: PlayButton = {
        id: Date.now().toString(),
        url: url.trim(),
        platform: validated.platform,
        title: validated.title,
        artist: validated.artist,
        embedUrl: validated.embedUrl,
        createdAt: new Date(),
      }

      const updatedButtons = [newPlayButton, ...playButtons]
      setPlayButtons(updatedButtons)
      savePlayButtons(updatedButtons)
      setUrl("")
      setValidationError("")

      toast.success(`${validated.platform} play button added successfully!`)
    } catch (error) {
      // Error already handled in validateUrl
    }
  }

  const handleRemovePlayButton = (id: string) => {
    const updatedButtons = playButtons.filter((pb) => pb.id !== id)
    setPlayButtons(updatedButtons)
    savePlayButtons(updatedButtons)
    toast.success("Play button removed")
  }

  const handleCopyLink = async (playButton: PlayButton) => {
    try {
      await navigator.clipboard.writeText(playButton.url)
      setCopiedId(playButton.id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success("Link copied to clipboard")
    } catch (error) {
      console.error("Failed to copy link:", error)
      toast.error("Failed to copy link")
    }
  }

  const handleSignIn = async () => {
    try {
      await signIn()
      toast.success("Successfully signed in!")
    } catch (error) {
      toast.error("Failed to sign in")
    }
  }

  const handleSignOut = () => {
    signOut()
    toast.success("Signed out successfully")
  }

  // Show loading state while SDK initializes
  if (!isSDKReady || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Farcaster SDK...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add Play Button</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your music and video links into interactive play buttons for Farcaster. Support for Spotify, Apple
            Music, YouTube, and SoundCloud.
          </p>
        </div>

        {/* Authentication Section */}
        {!isAuthenticated ? (
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Connect with Farcaster
              </CardTitle>
              <CardDescription>
                Get started with your Farcaster account to create and share play buttons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="w-16 h-16">
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
              </div>

              <Button onClick={handleSignIn} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Get Started
                  </>
                )}
              </Button>

              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This app works best when opened from within Farcaster. If you're testing outside of Farcaster, a demo
                  mode will be used.
                </AlertDescription>
              </Alert>

              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Debug Info
              </Button>

              {showDebug && (
                <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1">
                  <div>SDK Ready: {isSDKReady ? "Yes" : "No"}</div>
                  <div>Loading: {isLoading ? "Yes" : "No"}</div>
                  <div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
                  <div>User: {user ? user.username : "None"}</div>
                  <div>Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}</div>
                  <div>In Frame: {typeof window !== "undefined" && window.self !== window.top ? "Yes" : "No"}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* User Info */
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.pfpUrl || "/placeholder.svg"} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold">{user.displayName}</h2>
                    <Badge variant="default" className="text-xs">
                      {user.fid === 12345 ? "Demo Mode" : "Connected"}
                    </Badge>
                  </div>
                  <p className="text-gray-600">@{user.username}</p>
                  {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{user.followerCount?.toLocaleString()} followers</span>
                    <span>{user.followingCount?.toLocaleString()} following</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Play Button Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Add New Play Button
            </CardTitle>
            <CardDescription>Paste a link from Spotify, Apple Music, YouTube, or SoundCloud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL Input Field */}
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-gray-700">
                Music or Video URL
              </label>
              <Input
                id="url-input"
                placeholder="https://open.spotify.com/track/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full"
                disabled={isValidating}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayButton()}
              />
            </div>

            {/* Add Button */}
            <Button
              onClick={handleAddPlayButton}
              disabled={isValidating || !url.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Add Play Button
                </>
              )}
            </Button>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Play Buttons List */}
        {playButtons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Your Play Buttons ({playButtons.length})
            </h2>

            {playButtons.map((playButton) => (
              <PlayButtonCard
                key={playButton.id}
                playButton={playButton}
                onRemove={handleRemovePlayButton}
                onCopyLink={handleCopyLink}
                copiedId={copiedId}
              />
            ))}
          </div>
        )}

        {playButtons.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No play buttons yet</h3>
              <p className="text-gray-600">Add your first music or video link to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
