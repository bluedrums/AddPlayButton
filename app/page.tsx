"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Music, Play, ExternalLink, User, AlertCircle, Info } from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"
import { useFarcasterSDK } from "@/components/farcaster-sdk-provider"
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal"
import { PlayButtonCard } from "@/components/play-button-card"
import { CastComposer } from "@/components/cast-composer"
import { toast } from "sonner"

interface PlayButton {
  id: string
  url: string
  title: string
  artist: string
  platform: string
  embedUrl: string
  thumbnailUrl: string
  addedAt: Date
}

export default function AddPlayButtonApp() {
  const { user, isAuthenticated, isLoading, error: authError, signIn, signOut, authType } = useFarcaster()
  const { isSDKReady, isCreating } = useFarcasterSDK()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [playButtons, setPlayButtons] = useState<PlayButton[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [imageError, setImageError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayButton | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load saved play buttons from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("playButtons")
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((pb: any) => ({
          ...pb,
          addedAt: new Date(pb.addedAt),
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

  const validateImage = (file: File): Promise<{ isValid: boolean; error?: string; dataUrl?: string }> => {
    return new Promise((resolve) => {
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        resolve({ isValid: false, error: "File size must be less than 10MB" })
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        resolve({ isValid: false, error: "Please select an image file" })
        return
      }

      const img = new Image()
      const reader = new FileReader()

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        img.onload = () => {
          const { width, height } = img
          const aspectRatio = width / height

          // Check minimum dimensions
          if (width < 600 || height < 400) {
            resolve({ isValid: false, error: "Image must be at least 600x400px" })
            return
          }

          // Check maximum dimensions
          if (width > 3000 || height > 2000) {
            resolve({ isValid: false, error: "Image must not exceed 3000x2000px" })
            return
          }

          // Check aspect ratio (3:2 = 1.5, allow some tolerance)
          const targetRatio = 3 / 2
          const tolerance = 0.1
          if (Math.abs(aspectRatio - targetRatio) > tolerance) {
            resolve({
              isValid: false,
              error: `Image must have a 3:2 aspect ratio (current: ${width}x${height})`,
            })
            return
          }

          resolve({ isValid: true, dataUrl })
        }

        img.onerror = () => {
          resolve({ isValid: false, error: "Invalid image file" })
        }

        img.src = dataUrl
      }

      reader.onerror = () => {
        resolve({ isValid: false, error: "Failed to read image file" })
      }

      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageError("")

    const validation = await validateImage(file)

    if (!validation.isValid) {
      setImageError(validation.error || "Invalid image")
      setCoverImage(null)
      setCoverImageFile(null)
      return
    }

    setCoverImage(validation.dataUrl || null)
    setCoverImageFile(file)
    setImageError("")
  }

  const handleRemoveImage = () => {
    setCoverImage(null)
    setCoverImageFile(null)
    setImageError("")
    // Reset the file input
    const fileInput = document.getElementById("cover-image-input") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const extractMusicInfo = (url: string) => {
    const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    const appleMusicMatch = url.match(/music\.apple\.com\/[a-z]{2}\/(?:album|song)\/[^/]+\/(\d+)/)
    const soundcloudMatch = url.match(/soundcloud\.com\/([^/]+)\/([^/?]+)/)

    if (spotifyMatch) {
      const [, type, id] = spotifyMatch
      return {
        platform: "Spotify",
        embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
        thumbnailUrl: "/placeholder.svg?height=300&width=300&text=Spotify",
        title: "Spotify Track",
        artist: "Unknown Artist",
      }
    }

    if (youtubeMatch) {
      const [, id] = youtubeMatch
      return {
        platform: "YouTube",
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        title: "YouTube Video",
        artist: "Unknown Channel",
      }
    }

    if (appleMusicMatch) {
      return {
        platform: "Apple Music",
        embedUrl: url,
        thumbnailUrl: "/placeholder.svg?height=300&width=300&text=Apple+Music",
        title: "Apple Music Track",
        artist: "Unknown Artist",
      }
    }

    if (soundcloudMatch) {
      return {
        platform: "SoundCloud",
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}`,
        thumbnailUrl: "/placeholder.svg?height=300&width=300&text=SoundCloud",
        title: "SoundCloud Track",
        artist: soundcloudMatch[1],
      }
    }

    return null
  }

  const handleAddPlayButton = async () => {
    if (!url.trim()) {
      toast.error("Please enter a music or video URL")
      return
    }

    setIsProcessing(true)

    try {
      const musicInfo = extractMusicInfo(url)

      if (!musicInfo) {
        toast.error("Unsupported URL. Please use Spotify, YouTube, Apple Music, or SoundCloud links.")
        return
      }

      const newPlayButton: PlayButton = {
        id: Date.now().toString(),
        url: url.trim(),
        ...musicInfo,
        addedAt: new Date(),
      }

      setPlayButtons((prev) => [newPlayButton, ...prev])
      setUrl("")

      toast.success(`${musicInfo.platform} play button added successfully!`)
    } catch (error) {
      console.error("Error adding play button:", error)
      toast.error("Failed to add play button. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemovePlayButton = (id: string) => {
    setPlayButtons((prev) => prev.filter((button) => button.id !== id))
    toast.success("Play button removed")
  }

  const handlePlayClick = (playButton: PlayButton) => {
    setSelectedPlayer(playButton)
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
      // Toast messages are now handled in the provider
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Farcaster SDK...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
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
              <CardDescription>Authentication will happen automatically when opened from Warpcast</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>

                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Try Authentication
                    </>
                  )}
                </Button>
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Automatic Auth:</strong> When opened from Warpcast, you'll be automatically signed in.
                  <br />
                  <strong>Demo Mode:</strong> You can still create and preview play buttons without authentication.
                </AlertDescription>
              </Alert>

              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                  </div>
                  Debug Info
                </div>
              </Button>

              {showDebug && (
                <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                    </div>
                    <span>API Key: {process.env.WARPCAST_API_KEY ? "✅ Configured" : "❌ Missing"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                    </div>
                    <span>Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}</span>
                  </div>
                  <div>SDK Ready: {isSDKReady ? "Yes" : "No"}</div>
                  <div>Loading: {isLoading ? "Yes" : "No"}</div>
                  <div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
                  <div>Auth Type: {authType}</div>
                  <div>In Frame: {typeof window !== "undefined" && window.self !== window.top ? "Yes" : "No"}</div>
                  <div>
                    Referrer: {typeof window !== "undefined" ? document.referrer.substring(0, 30) + "..." : "N/A"}
                  </div>
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
                    <Badge variant={authType === "real" ? "default" : "secondary"} className="text-xs">
                      {authType === "real" ? "🔗 Connected" : "🎭 Demo Mode"}
                    </Badge>
                  </div>
                  <p className="text-gray-600">@{user.username}</p>
                  {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{user.followerCount?.toLocaleString()} followers</span>
                    <span>{user.followingCount?.toLocaleString()} following</span>
                  </div>
                  {authType === "demo" && (
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Demo Mode:</strong> Open from Warpcast to create real casts on your timeline.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-red-600 rounded-full"></div>
                    </div>
                    Sign Out
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Play Button Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Add New Play Button
            </CardTitle>
            <CardDescription>Paste a link from Spotify, Apple Music, YouTube, or SoundCloud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title Input Field */}
            <div className="space-y-2">
              <label htmlFor="title-input" className="text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title-input"
                placeholder="Enter a title for your play button..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                disabled={isValidating}
              />
            </div>

            {/* URL Input Field */}
            <div className="flex gap-2">
              <Input
                placeholder="https://open.spotify.com/track/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddPlayButton()}
                className="flex-1"
              />
              <Button onClick={handleAddPlayButton} disabled={isProcessing || !url.trim()}>
                {isProcessing ? "Adding..." : "Add"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <Badge variant="outline">Spotify</Badge>
              <Badge variant="outline">YouTube</Badge>
              <Badge variant="outline">Apple Music</Badge>
              <Badge variant="outline">SoundCloud</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Play Buttons List */}
        {playButtons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your Play Buttons</h2>
              <Badge variant="secondary">{playButtons.length}</Badge>
            </div>

            <div className="space-y-3">
              {playButtons.map((playButton) => (
                <PlayButtonCard
                  key={playButton.id}
                  playButton={playButton}
                  onPlay={() => handlePlayClick(playButton)}
                  onRemove={() => handleRemovePlayButton(playButton.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cast Composer */}
        {playButtons.length > 0 && (
          <>
            <Separator className="my-8" />
            <CastComposer playButtons={playButtons} />
          </>
        )}

        {/* Empty State */}
        {playButtons.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No play buttons yet</h3>
              <p className="text-gray-500 mb-4">Add your first music or video link to get started</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <ExternalLink className="h-4 w-4" />
                <span>Supports Spotify, YouTube, Apple Music & SoundCloud</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Embedded Player Modal */}
        {selectedPlayer && (
          <EmbeddedPlayerModal
            playButton={selectedPlayer}
            isOpen={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    </div>
  )
}
