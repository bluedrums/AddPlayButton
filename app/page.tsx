"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, User, Play, ExternalLink, X } from "lucide-react"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
}

interface CastData {
  id: string
  url: string
  embedUrl: string
  embedType: "spotify" | "apple" | "soundcloud"
  timestamp: number
  text: string
}

export default function FarcasterMiniApp() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignIn, setShowSignIn] = useState(false)
  const [linkToPlay, setLinkToPlay] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [embedUrl, setEmbedUrl] = useState("")
  const [embedType, setEmbedType] = useState<"spotify" | "apple" | "soundcloud" | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [showPlayerPopup, setShowPlayerPopup] = useState(false)
  const [currentCast, setCurrentCast] = useState<CastData | null>(null)
  const [recentCasts, setRecentCasts] = useState<CastData[]>([])

  const validateMusicUrl = (url: string): { isValid: boolean; type: "spotify" | "apple" | "soundcloud" | null } => {
    if (!url) return { isValid: false, type: null }

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // Spotify validation
      if (hostname === "open.spotify.com" || hostname === "spotify.com") {
        if (url.includes("/track/") || url.includes("/album/") || url.includes("/playlist/")) {
          return { isValid: true, type: "spotify" }
        }
      }

      // Apple Music validation
      if (hostname === "music.apple.com") {
        if (url.includes("/album/") || url.includes("/song/") || url.includes("/playlist/")) {
          return { isValid: true, type: "apple" }
        }
      }

      // SoundCloud validation
      if (hostname === "soundcloud.com" || hostname === "m.soundcloud.com") {
        // SoundCloud URLs typically have artist/track format
        const pathParts = urlObj.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          return { isValid: true, type: "soundcloud" }
        }
      }

      return { isValid: false, type: null }
    } catch {
      return { isValid: false, type: null }
    }
  }

  const convertToEmbedUrl = (url: string, type: "spotify" | "apple" | "soundcloud"): string => {
    try {
      const urlObj = new URL(url)

      switch (type) {
        case "spotify":
          // Convert spotify.com or open.spotify.com to embed format
          if (urlObj.hostname === "spotify.com") {
            return url.replace("spotify.com", "open.spotify.com/embed")
          } else if (urlObj.hostname === "open.spotify.com") {
            return url.replace("open.spotify.com", "open.spotify.com/embed")
          }
          break

        case "apple":
          // Apple Music embed format
          return url.replace("music.apple.com", "embed.music.apple.com")

        case "soundcloud":
          // SoundCloud embed format
          return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`
      }

      return url
    } catch {
      return url
    }
  }

  // Load casts from localStorage on component mount
  useEffect(() => {
    const savedCasts = localStorage.getItem("farcaster-casts")
    if (savedCasts) {
      setRecentCasts(JSON.parse(savedCasts))
    }
  }, [])

  // Save cast data to Farcaster storage (simulated with localStorage)
  const saveCastToStorage = (castData: CastData) => {
    const existingCasts = JSON.parse(localStorage.getItem("farcaster-casts") || "[]")
    const updatedCasts = [castData, ...existingCasts].slice(0, 10) // Keep last 10 casts
    localStorage.setItem("farcaster-casts", JSON.stringify(updatedCasts))
    setRecentCasts(updatedCasts)
  }

  // Create a Cast with the music URL
  const createCast = async (url: string, embedUrl: string, embedType: "spotify" | "apple" | "soundcloud") => {
    const castId = `cast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const platformName = embedType.charAt(0).toUpperCase() + embedType.slice(1)

    const castData: CastData = {
      id: castId,
      url: url,
      embedUrl: embedUrl,
      embedType: embedType,
      timestamp: Date.now(),
      text: `🎵 Check out this track on ${platformName}! Click to play: ${url}`,
    }

    // Save to Farcaster storage
    saveCastToStorage(castData)

    // Simulate posting to Farcaster
    console.log("Creating Cast:", castData)

    return castData
  }

  // Handle Cast URL click
  const handleCastClick = (castData: CastData) => {
    setCurrentCast(castData)
    setShowPlayerPopup(true)
  }

  // Debounced URL validation
  const debouncedValidateUrl = useCallback(
    debounce((url: string) => {
      const validation = validateMusicUrl(url)
      setIsValidUrl(validation.isValid)
      setEmbedType(validation.type)

      if (validation.isValid && validation.type) {
        const embed = convertToEmbedUrl(url, validation.type)
        setEmbedUrl(embed)
      } else {
        setEmbedUrl("")
      }
    }, 500),
    [],
  )

  // Simple debounce function
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }) as T
  }

  // Simulate Farcaster authentication check
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)

      // Simulate checking for existing auth
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if user data exists in localStorage (simulating persistent auth)
      const savedUser = localStorage.getItem("farcaster-user")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      } else {
        setShowSignIn(true)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleSignIn = async () => {
    setIsLoading(true)

    // Simulate Farcaster sign-in process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock user data - in real app this would come from Farcaster
    const mockUser: FarcasterUser = {
      fid: 12345,
      username: "alice",
      displayName: "Alice Johnson",
      pfpUrl: "/placeholder.svg?height=40&width=40",
    }

    setUser(mockUser)
    localStorage.setItem("farcaster-user", JSON.stringify(mockUser))
    setShowSignIn(false)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkToPlay.trim() || !isValidUrl || !embedType) return

    setIsSubmitting(true)

    try {
      // Create the Cast with embedded player data
      const castData = await createCast(linkToPlay, embedUrl, embedType)

      // Simulate Cast creation delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("Cast created:", castData)
      alert(
        `🎵 Cast created! Your ${embedType.charAt(0).toUpperCase()}${embedType.slice(1)} play button has been added to Farcaster.`,
      )

      // Reset form
      setLinkToPlay("")
      setEmbedUrl("")
      setEmbedType(null)
      setIsValidUrl(false)
    } catch (error) {
      console.error("Error creating cast:", error)
      alert("Failed to create cast. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    localStorage.removeItem("farcaster-user")
    setShowSignIn(true)
  }

  if (isLoading && !showSignIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Connecting to Farcaster...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-8 space-y-6">
        {user ? (
          <>
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {user.pfpUrl ? (
                    <img
                      src={user.pfpUrl || "/placeholder.svg"}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <User className="w-10 h-10 text-purple-600" />
                  )}
                  <div>
                    <CardTitle className="text-xl">Hello {user.displayName}!</CardTitle>
                    <CardDescription>@{user.username}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link-to-play">Link to Play</Label>
                    <Input
                      id="link-to-play"
                      type="url"
                      placeholder="Paste a Spotify, Apple Music, or SoundCloud link"
                      value={linkToPlay}
                      onChange={(e) => {
                        const newValue = e.target.value
                        setLinkToPlay(newValue)
                        debouncedValidateUrl(newValue)
                      }}
                      className={`${linkToPlay && !isValidUrl ? "border-red-300 focus:border-red-500" : ""}`}
                      required
                    />
                    {linkToPlay && !isValidUrl && (
                      <p className="text-sm text-red-600 mt-1">
                        Please enter a valid Spotify, Apple Music, or SoundCloud URL
                      </p>
                    )}
                    {linkToPlay && isValidUrl && embedType && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Valid {embedType.charAt(0).toUpperCase() + embedType.slice(1)} link detected
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isSubmitting || !linkToPlay.trim() || !isValidUrl}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Cast...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Add Play Button
                      </>
                    )}
                  </Button>
                </form>
                {embedUrl && embedType && (
                  <div className="mt-6 space-y-2">
                    <Label className="text-sm font-medium">Preview</Label>
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      {embedType === "spotify" && (
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="152"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          title="Spotify Player"
                        />
                      )}
                      {embedType === "apple" && (
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="150"
                          frameBorder="0"
                          allow="autoplay *; encrypted-media *; fullscreen *"
                          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                          title="Apple Music Player"
                        />
                      )}
                      {embedType === "soundcloud" && (
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="166"
                          frameBorder="0"
                          allow="autoplay"
                          title="SoundCloud Player"
                        />
                      )}
                    </div>
                  </div>
                )}
                <Button variant="ghost" onClick={handleSignOut} className="w-full mt-4 text-gray-600">
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Recent Casts */}
            {recentCasts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Recent Casts</CardTitle>
                  <CardDescription>Click on any cast to open the music player</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCasts.map((cast) => (
                      <div
                        key={cast.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleCastClick(cast)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">
                              {cast.embedType.charAt(0).toUpperCase() + cast.embedType.slice(1)} Track
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {new Date(cast.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}

        {/* Sign In Dialog */}
        <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Sign in with Farcaster</DialogTitle>
              <DialogDescription className="text-center">Connect your Farcaster account to continue</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <Button onClick={handleSignIn} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Farcaster"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Music Player Popup */}
        <Dialog open={showPlayerPopup} onOpenChange={setShowPlayerPopup}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-purple-600" />
                  {currentCast?.embedType.charAt(0).toUpperCase()}
                  {currentCast?.embedType.slice(1)} Player
                </DialogTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPlayerPopup(false)} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>Playing from your Farcaster Cast</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentCast && (
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  {currentCast.embedType === "spotify" && (
                    <iframe
                      src={currentCast.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title="Spotify Player"
                    />
                  )}
                  {currentCast.embedType === "apple" && (
                    <iframe
                      src={currentCast.embedUrl}
                      width="100%"
                      height="150"
                      frameBorder="0"
                      allow="autoplay *; encrypted-media *; fullscreen *"
                      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                      title="Apple Music Player"
                    />
                  )}
                  {currentCast.embedType === "soundcloud" && (
                    <iframe
                      src={currentCast.embedUrl}
                      width="100%"
                      height="166"
                      frameBorder="0"
                      allow="autoplay"
                      title="SoundCloud Player"
                    />
                  )}
                </div>
              )}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Original URL:</p>
                <a
                  href={currentCast?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline break-all"
                >
                  {currentCast?.url}
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
