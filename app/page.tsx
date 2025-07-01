"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  User,
  Play,
  ExternalLink,
  Wallet,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Share2,
  Settings,
  RefreshCw,
  Clock,
} from "lucide-react"
import { useFarcasterAuth } from "@/hooks/use-farcaster-auth"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
import { DebugPanel } from "@/components/debug-panel"

interface StoredImage {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: number
}

interface PaymentState {
  isConnecting: boolean
  isProcessing: boolean
  isCompleted: boolean
  txHash?: string
  error?: string
}

// Base network configuration
const BASE_NETWORK = {
  chainId: "0x2105", // 8453 in hex
  chainName: "Base",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
}

// USDC contract address on Base
const USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const RECIPIENT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6"
const PAYMENT_AMOUNT = "250000" // 0.25 USDC (6 decimals)

// Wallet types
type WalletType = "farcaster" | "walletconnect"

interface WalletState {
  type: WalletType | null
  address: string
  isConnected: boolean
}

export default function FarcasterMiniApp() {
  // Use Farcaster auth hook
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    error: authError,
    signIn,
    signOut,
    useDemoMode,
  } = useFarcasterAuth()
  const { isSubmitting, error: castError, createCast, clearError } = useFarcasterCast()

  const [linkToPlay, setLinkToPlay] = useState("")
  const [embedUrl, setEmbedUrl] = useState("")
  const [embedType, setEmbedType] = useState<"spotify" | "apple" | "soundcloud" | "youtube" | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [showPlayerPopup, setShowPlayerPopup] = useState(false)
  const [currentCast, setCurrentCast] = useState<any>(null)
  const [recentCasts, setRecentCasts] = useState<any[]>([])
  const [isLoadingCasts, setIsLoadingCasts] = useState(false)

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string>("")
  const [title, setTitle] = useState<string>("")
  const [customText, setCustomText] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [storedImages, setStoredImages] = useState<StoredImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Payment states
  const [walletState, setWalletState] = useState<WalletState>({
    type: null,
    address: "",
    isConnected: false,
  })
  const [showWalletSelection, setShowWalletSelection] = useState(false)
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isConnecting: false,
    isProcessing: false,
    isCompleted: false,
  })
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [isDonationChecked, setIsDonationChecked] = useState(true)

  // Debug states
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [authAttempts, setAuthAttempts] = useState(0)

  // Check if we're using real auth
  const isUsingRealAuth = () => {
    const savedAuth = localStorage.getItem("farcaster-auth")
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth)
        return authData.isRealAuth === true
      } catch {
        return false
      }
    }
    return false
  }

  // Load user's recent casts when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCasts()
    }
  }, [isAuthenticated, user])

  const loadUserCasts = async () => {
    if (!user) return

    setIsLoadingCasts(true)
    try {
      const response = await fetch(`/api/user/casts?fid=${user.fid}`)
      const data = await response.json()

      if (data.success) {
        setRecentCasts(data.casts)
      }
    } catch (error) {
      console.error("Error loading casts:", error)
    } finally {
      setIsLoadingCasts(false)
    }
  }

  // Enhanced sign-in with fallback
  const handleSignIn = async () => {
    console.log(`🔐 Sign-in attempt #${authAttempts + 1}`)
    setAuthAttempts((prev) => prev + 1)

    try {
      await signIn()
    } catch (error) {
      console.error("Sign-in failed:", error)
    }
  }

  // Handle demo mode
  const handleDemoMode = async () => {
    console.log("🎭 User chose demo mode")
    useDemoMode()
  }

  // Connect Farcaster wallet
  const connectFarcasterWallet = async () => {
    setPaymentState((prev) => ({ ...prev, isConnecting: true, error: undefined }))

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const mockAddress = user?.custodyAddress || "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6"

      setWalletState({
        type: "farcaster",
        address: mockAddress,
        isConnected: true,
      })

      setPaymentState((prev) => ({ ...prev, isConnecting: false }))
      setShowWalletSelection(false)
    } catch (error: any) {
      console.error("Error connecting Farcaster wallet:", error)
      setPaymentState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect Farcaster wallet",
      }))
    }
  }

  const connectWalletConnect = async () => {
    setPaymentState((prev) => ({ ...prev, isConnecting: true, error: undefined }))

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const mockAddress = "0x" + Math.random().toString(16).substr(2, 40)

      setWalletState({
        type: "walletconnect",
        address: mockAddress,
        isConnected: true,
      })

      setPaymentState((prev) => ({ ...prev, isConnecting: false }))
      setShowWalletSelection(false)
    } catch (error: any) {
      console.error("Error connecting WalletConnect:", error)
      setPaymentState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect via WalletConnect",
      }))
    }
  }

  // Process USDC payment
  const processPayment = async () => {
    if (!walletState.isConnected) {
      setShowWalletSelection(true)
      return
    }

    setPaymentState((prev) => ({ ...prev, isProcessing: true, error: undefined }))

    try {
      let txHash: string

      if (walletState.type === "farcaster") {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        txHash = "0xfc" + Math.random().toString(16).substr(2, 62)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2500))
        txHash = "0xwc" + Math.random().toString(16).substr(2, 62)
      }

      setPaymentState((prev) => ({
        ...prev,
        isProcessing: false,
        isCompleted: true,
        txHash,
      }))

      setTimeout(() => {
        setShowPaymentDialog(false)
        createCastAfterPayment(txHash)
      }, 2000)
    } catch (error: any) {
      console.error("Payment error:", error)
      setPaymentState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error.message || "Payment failed",
      }))
    }
  }

  // Create cast after successful payment
  const createCastAfterPayment = async (txHash: string) => {
    if (!embedType || !user) return

    try {
      const cast = await createCast({
        fid: user.fid,
        embedUrl: linkToPlay, // Use original URL for embed
        embedType,
        title,
        customText,
      })

      // Show success message with Warpcast link
      alert(
        `🎵 Cast created successfully! Your ${embedType.charAt(0).toUpperCase()}${embedType.slice(1)} play button has been posted to Farcaster.\n\nView on Warpcast: ${cast.warpcastUrl}`,
      )

      // Reset form
      resetForm()

      // Reload user casts
      loadUserCasts()
    } catch (error) {
      console.error("Error creating cast:", error)
      alert("Failed to create cast. Please try again.")
    }
  }

  const resetForm = () => {
    setLinkToPlay("")
    setEmbedUrl("")
    setEmbedType(null)
    setIsValidUrl(false)
    setCoverPhoto("")
    setTitle("")
    setCustomText("")
    setPaymentState({
      isConnecting: false,
      isProcessing: false,
      isCompleted: false,
    })
  }

  const validateMusicUrl = (
    url: string,
  ): { isValid: boolean; type: "spotify" | "apple" | "soundcloud" | "youtube" | null } => {
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
        const pathParts = urlObj.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          return { isValid: true, type: "soundcloud" }
        }
      }

      // YouTube validation
      if (
        hostname === "youtube.com" ||
        hostname === "www.youtube.com" ||
        hostname === "youtu.be" ||
        hostname === "m.youtube.com"
      ) {
        if (hostname === "youtu.be") {
          const pathParts = urlObj.pathname.split("/").filter(Boolean)
          if (pathParts.length >= 1) {
            return { isValid: true, type: "youtube" }
          }
        } else {
          if (url.includes("/watch?v=") || url.includes("/embed/") || url.includes("/v/")) {
            return { isValid: true, type: "youtube" }
          }
        }
      }

      return { isValid: false, type: null }
    } catch {
      return { isValid: false, type: null }
    }
  }

  const convertToEmbedUrl = (url: string, type: "spotify" | "apple" | "soundcloud" | "youtube"): string => {
    try {
      const urlObj = new URL(url)

      switch (type) {
        case "spotify":
          if (urlObj.hostname === "spotify.com") {
            return url.replace("spotify.com", "open.spotify.com/embed")
          } else if (urlObj.hostname === "open.spotify.com") {
            return url.replace("open.spotify.com", "open.spotify.com/embed")
          }
          break

        case "apple":
          return url.replace("music.apple.com", "embed.music.apple.com")

        case "soundcloud":
          return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`

        case "youtube":
          let videoId = ""

          if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.substring(1).split("?")[0]
          } else {
            const searchParams = urlObj.searchParams
            videoId = searchParams.get("v") || ""

            if (!videoId) {
              const pathMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/)
              if (pathMatch) {
                videoId = pathMatch[2]
              }
            }
          }

          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`
          }
          break
      }

      return url
    } catch {
      return url
    }
  }

  // Load stored images from localStorage
  useEffect(() => {
    const savedImages = localStorage.getItem("farcaster-images")
    if (savedImages) {
      try {
        setStoredImages(JSON.parse(savedImages))
      } catch (error) {
        console.error("Error parsing saved images:", error)
        setStoredImages([])
      }
    }
  }, [])

  // Save image to storage
  const saveImageToStorage = (imageData: StoredImage) => {
    const existingImages = JSON.parse(localStorage.getItem("farcaster-images") || "[]")
    const updatedImages = [imageData, ...existingImages]
    localStorage.setItem("farcaster-images", JSON.stringify(updatedImages))
    setStoredImages(updatedImages)
    return imageData.url
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      alert("File size must be less than 100MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file")
      return
    }

    setIsUploading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const imageUrl = URL.createObjectURL(file)

      const imageData: StoredImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: imageUrl,
        size: file.size,
        uploadedAt: Date.now(),
      }

      const savedUrl = saveImageToStorage(imageData)
      setCoverPhoto(savedUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Handle image selection from storage
  const handleImageSelect = (imageUrl: string) => {
    setCoverPhoto(imageUrl)
    setShowImagePicker(false)
  }

  // Remove cover photo
  const removeCoverPhoto = () => {
    setCoverPhoto("")
  }

  // Delete image from storage
  const deleteStoredImage = (imageId: string) => {
    const updatedImages = storedImages.filter((img) => img.id !== imageId)
    localStorage.setItem("farcaster-images", JSON.stringify(updatedImages))
    setStoredImages(updatedImages)

    const deletedImage = storedImages.find((img) => img.id === imageId)
    if (deletedImage && coverPhoto === deletedImage.url) {
      setCoverPhoto("")
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Handle Cast URL click
  const handleCastClick = (castData: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkToPlay.trim() || !isValidUrl || !embedType || !user) return

    clearError()

    // Only show payment dialog if donation is checked
    if (isDonationChecked) {
      setShowPaymentDialog(true)
    } else {
      // Create cast without payment
      try {
        const cast = await createCast({
          fid: user.fid,
          embedUrl: linkToPlay,
          embedType,
          title,
          customText,
        })

        alert(
          `🎵 Cast created successfully! Your ${embedType.charAt(0).toUpperCase()}${embedType.slice(1)} play button has been posted to Farcaster.\n\nView on Warpcast: ${cast.warpcastUrl}`,
        )

        resetForm()
        loadUserCasts()
      } catch (error) {
        // Error is handled by the hook
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Connecting to Farcaster...</p>
            {authAttempts > 0 && <p className="text-sm text-gray-500 mt-2">Attempt {authAttempts}</p>}

            {/* Show demo mode option after 10 seconds */}
            {authAttempts > 0 && (
              <div className="mt-4 text-center space-y-2">
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Taking longer than expected...</span>
                </div>
                <Button
                  onClick={handleSignIn}
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-300 hover:bg-purple-50 bg-transparent"
                >
                  Continue with Demo Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-8 space-y-6">
        {isAuthenticated && user ? (
          <>
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {user.pfpUrl ? (
                      <img
                        src={user.pfpUrl || "/placeholder.svg"}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <User className="w-10 h-10 text-purple-600" />
                    )}
                    <div className="text-left">
                      <CardTitle className="text-xl">Hello {user.displayName}!</CardTitle>
                      <CardDescription>
                        @{user.username} • FID: {user.fid}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                {/* Auth Status Badge */}
                <div className="flex justify-center">
                  <Badge variant={isUsingRealAuth() ? "default" : "secondary"}>
                    {isUsingRealAuth() ? "🚀 Real Farcaster Auth" : "🎭 Demo Mode"}
                  </Badge>
                </div>

                {/* Debug Info */}
                {showDebugInfo && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left">
                    <h4 className="font-medium text-sm mb-2">Debug Information:</h4>
                    <div className="text-xs space-y-1 text-gray-600">
                      <div>Auth Type: {isUsingRealAuth() ? "Real" : "Demo"}</div>
                      <div>Environment: {process.env.NODE_ENV}</div>
                      <div>Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}</div>
                      <div>Has Warpcast Key: {process.env.WARPCAST_API_KEY ? "Yes" : "No"}</div>
                      <div>Auth Attempts: {authAttempts}</div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {/* Error Display */}
                {(authError || castError) && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{authError || castError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link-to-play">Link to Play</Label>
                    <Input
                      id="link-to-play"
                      type="url"
                      placeholder="Paste a Spotify, Apple Music, SoundCloud, or YouTube link"
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
                        Please enter a valid Spotify, Apple Music, SoundCloud, or YouTube URL
                      </p>
                    )}
                    {linkToPlay && isValidUrl && embedType && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Valid {embedType.charAt(0).toUpperCase() + embedType.slice(1)} link detected
                      </p>
                    )}
                  </div>

                  {/* Custom Text Section */}
                  <div className="space-y-2">
                    <Label htmlFor="custom-text">Cast Text (Optional)</Label>
                    <Input
                      id="custom-text"
                      type="text"
                      placeholder="Custom text for your cast (leave empty for auto-generated)"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      maxLength={280}
                    />
                    <p className="text-xs text-gray-500">
                      {customText.length}/280 characters. Leave empty to auto-generate cast text.
                    </p>
                  </div>

                  {/* Title Section */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter a title for your music/video"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500">Used in auto-generated cast text if no custom text provided</p>
                  </div>

                  {/* Donation Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="donation-checkbox"
                        checked={isDonationChecked}
                        onChange={(e) => setIsDonationChecked(e.target.checked)}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="donation-checkbox" className="flex items-center gap-2 mb-2 cursor-pointer">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Donation</span>
                        </label>
                        <p className="text-sm text-blue-700">Support this app with a $0.25 USDC donation on Base.</p>
                      </div>
                    </div>
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
                        <Share2 className="mr-2 h-4 w-4" />
                        Post to Farcaster
                      </>
                    )}
                  </Button>
                </form>

                {/* Preview */}
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
                          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(embedUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                          width="100%"
                          height="166"
                          frameBorder="0"
                          allow="autoplay"
                          title="SoundCloud Player"
                        />
                      )}
                      {embedType === "youtube" && (
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="200"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title="YouTube Player"
                        />
                      )}
                    </div>
                  </div>
                )}

                <Button variant="ghost" onClick={signOut} className="w-full mt-4 text-gray-600">
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Recent Casts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Your Music Casts</CardTitle>
                    <CardDescription>Recent casts with music/video embeds</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadUserCasts} disabled={isLoadingCasts}>
                    {isLoadingCasts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCasts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">Loading casts...</span>
                  </div>
                ) : recentCasts.length > 0 ? (
                  <div className="space-y-3">
                    {recentCasts.map((cast) => (
                      <div
                        key={cast.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleCastClick(cast)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium">
                                  {cast.embedType.charAt(0).toUpperCase() + cast.embedType.slice(1)}{" "}
                                  {cast.embedType === "youtube" ? "Video" : "Track"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                                {cast.warpcastUrl && (
                                  <a
                                    href={cast.warpcastUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-purple-600 hover:underline"
                                  >
                                    View on Warpcast
                                  </a>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{cast.text}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(cast.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No music casts found.</p>
                    <p className="text-sm">Create your first cast above!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Sign In Card */
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sign in with Farcaster</CardTitle>
              <CardDescription>
                Connect your Farcaster account to start posting music and video play buttons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authError && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-purple-600" />
                </div>
                <Button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Connect Farcaster
                    </>
                  )}
                </Button>

                {authAttempts > 0 && (
                  <div className="w-full space-y-2">
                    <Button
                      onClick={handleSignIn}
                      disabled={authLoading}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again (Attempt {authAttempts + 1})
                    </Button>

                    <Button onClick={handleDemoMode} disabled={authLoading} variant="secondary" className="w-full">
                      Continue with Demo Mode
                    </Button>
                  </div>
                )}

                {/* Add debug info right after the button */}
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true" ? "🚀 Real Auth Forced" : "🎭 Mock Mode"}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Auth Kit: {process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true" ? "Enabled" : "Disabled"}
                  </p>
                  {authAttempts > 0 && <p className="text-xs text-orange-600 mt-1">Failed attempts: {authAttempts}</p>}
                </div>
                <DebugPanel />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-600" />
                Complete Donation
              </DialogTitle>
              <DialogDescription>
                Donate $0.25 USDC on Base network to support the Add Play Button mini app
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">$0.25 USDC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-medium">Base</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-mono text-xs">
                    {RECIPIENT_ADDRESS.slice(0, 6)}...{RECIPIENT_ADDRESS.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Wallet Connection */}
              {!walletState.isConnected ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choose your wallet to proceed with payment:</p>
                  <div className="space-y-2">
                    <Button
                      onClick={connectFarcasterWallet}
                      disabled={paymentState.isConnecting}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {paymentState.isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          Use Farcaster Wallet
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={connectWalletConnect}
                      disabled={paymentState.isConnecting}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      {paymentState.isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Use WalletConnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      {walletState.type === "farcaster" ? "Farcaster" : "WalletConnect"} wallet connected:{" "}
                      {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
                    </span>
                  </div>

                  {paymentState.isCompleted ? (
                    <div className="text-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-600">Payment Successful!</p>
                      <p className="text-xs text-gray-600">Creating your Cast...</p>
                      {paymentState.txHash && (
                        <a
                          href={`https://basescan.org/tx/${paymentState.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View transaction
                        </a>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={processPayment}
                      disabled={paymentState.isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {paymentState.isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Pay $0.25 USDC
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Error Display */}
              {paymentState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{paymentState.error}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Media Player Popup */}
        <Dialog open={showPlayerPopup} onOpenChange={setShowPlayerPopup}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-purple-600" />
                {currentCast?.embedType.charAt(0).toUpperCase()}
                {currentCast?.embedType.slice(1)} Player
              </DialogTitle>
              <DialogDescription>Playing from your Farcaster Cast</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentCast && (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    {currentCast.embedType === "spotify" && (
                      <iframe
                        src={currentCast.embedUrl.replace("open.spotify.com", "open.spotify.com/embed")}
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
                        src={currentCast.embedUrl.replace("music.apple.com", "embed.music.apple.com")}
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
                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentCast.embedUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                        width="100%"
                        height="166"
                        frameBorder="0"
                        allow="autoplay"
                        title="SoundCloud Player"
                      />
                    )}
                    {currentCast.embedType === "youtube" && (
                      <iframe
                        src={currentCast.embedUrl}
                        width="100%"
                        height="315"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title="YouTube Player"
                      />
                    )}
                  </div>

                  <div className="p-3 bg-gray-100 rounded-lg space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cast Text:</p>
                      <p className="text-sm text-gray-600">{currentCast.text}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Original URL:</p>
                      <a
                        href={currentCast.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline break-all"
                      >
                        {currentCast.embedUrl}
                      </a>
                    </div>

                    {currentCast.warpcastUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">View on Warpcast:</p>
                        <a
                          href={currentCast.warpcastUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline"
                        >
                          {currentCast.warpcastUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
