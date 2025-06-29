"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Loader2,
  User,
  Play,
  ExternalLink,
  X,
  Upload,
  ImageIcon,
  Trash2,
  Wallet,
  DollarSign,
  CheckCircle,
} from "lucide-react"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  walletAddress?: string
}

interface StoredImage {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: number
}

interface CastData {
  id: string
  url: string
  embedUrl: string
  embedType: "spotify" | "apple" | "soundcloud" | "youtube"
  timestamp: number
  text: string
  coverPhoto?: string
  title?: string
  paymentTxHash?: string
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
const RECIPIENT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6" // Replace with your Farcaster wallet address
const PAYMENT_AMOUNT = "250000" // 0.25 USDC (6 decimals)

// Wallet types
type WalletType = "farcaster" | "walletconnect"

interface WalletState {
  type: WalletType | null
  address: string
  isConnected: boolean
}

export default function FarcasterMiniApp() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignIn, setShowSignIn] = useState(false)
  const [linkToPlay, setLinkToPlay] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [embedUrl, setEmbedUrl] = useState("")
  const [embedType, setEmbedType] = useState<"spotify" | "apple" | "soundcloud" | "youtube" | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [showPlayerPopup, setShowPlayerPopup] = useState(false)
  const [currentCast, setCurrentCast] = useState<CastData | null>(null)
  const [recentCasts, setRecentCasts] = useState<CastData[]>([])

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string>("")
  const [title, setTitle] = useState<string>("")
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
  const [isDonationChecked, setIsDonationChecked] = useState(true) // Add this line

  // Connect Farcaster wallet
  const connectFarcasterWallet = async () => {
    setPaymentState((prev) => ({ ...prev, isConnecting: true, error: undefined }))

    try {
      // Simulate Farcaster wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In real implementation, this would use Farcaster's wallet API
      const mockAddress = user?.walletAddress || "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6"

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
      // Simulate WalletConnect connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In real implementation, this would use WalletConnect SDK
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
        // Simulate Farcaster wallet payment
        await new Promise((resolve) => setTimeout(resolve, 2000))
        txHash = "0xfc" + Math.random().toString(16).substr(2, 62)

        console.log("Payment via Farcaster wallet:", {
          from: walletState.address,
          to: RECIPIENT_ADDRESS,
          amount: PAYMENT_AMOUNT,
          token: "USDC",
        })
      } else {
        // Simulate WalletConnect payment
        await new Promise((resolve) => setTimeout(resolve, 2500))
        txHash = "0xwc" + Math.random().toString(16).substr(2, 62)

        console.log("Payment via WalletConnect:", {
          from: walletState.address,
          to: RECIPIENT_ADDRESS,
          amount: PAYMENT_AMOUNT,
          token: "USDC",
        })
      }

      setPaymentState((prev) => ({
        ...prev,
        isProcessing: false,
        isCompleted: true,
        txHash,
      }))

      // Wait a moment then proceed with cast creation
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
    if (!embedType) return

    setIsSubmitting(true)

    try {
      const castData = await createCast(linkToPlay, embedUrl, embedType, coverPhoto, title, txHash)

      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("Cast created with payment:", castData)
      alert(
        `🎵 Cast created! Your ${embedType.charAt(0).toUpperCase()}${embedType.slice(1)} play button has been added to Farcaster. Payment confirmed!`,
      )

      // Reset form
      setLinkToPlay("")
      setEmbedUrl("")
      setEmbedType(null)
      setIsValidUrl(false)
      setCoverPhoto("")
      setTitle("")
      setPaymentState({
        isConnecting: false,
        isProcessing: false,
        isCompleted: false,
      })
    } catch (error) {
      console.error("Error creating cast:", error)
      alert("Failed to create cast. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCasts = localStorage.getItem("farcaster-casts")
    if (savedCasts) {
      try {
        const parsedCasts = JSON.parse(savedCasts)
        const migratedCasts = parsedCasts.map((cast: any) => ({
          ...cast,
          title: cast.title || undefined,
          paymentTxHash: cast.paymentTxHash || undefined,
        }))
        setRecentCasts(migratedCasts)
      } catch (error) {
        console.error("Error parsing saved casts:", error)
        setRecentCasts([])
      }
    }

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

  // Save cast data to Farcaster storage (simulated with localStorage)
  const saveCastToStorage = (castData: CastData) => {
    const existingCasts = JSON.parse(localStorage.getItem("farcaster-casts") || "[]")
    const updatedCasts = [castData, ...existingCasts].slice(0, 10)
    localStorage.setItem("farcaster-casts", JSON.stringify(updatedCasts))
    setRecentCasts(updatedCasts)
  }

  // Save image to Farcaster storage (simulated with localStorage)
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

      console.log("Image uploaded:", imageData)
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

  // Create a Cast with the music URL, cover photo, title, and payment hash
  const createCast = async (
    url: string,
    embedUrl: string,
    embedType: "spotify" | "apple" | "soundcloud" | "youtube",
    coverPhoto?: string,
    title?: string,
    paymentTxHash?: string,
  ) => {
    const castId = `cast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const platformName = embedType.charAt(0).toUpperCase() + embedType.slice(1)

    const castData: CastData = {
      id: castId,
      url: url,
      embedUrl: embedUrl,
      embedType: embedType,
      timestamp: Date.now(),
      text: `🎵 Check out this ${embedType === "youtube" ? "video" : "track"} on ${platformName}! Click to play: ${url}`,
      coverPhoto: coverPhoto,
      title: title,
      paymentTxHash: paymentTxHash,
    }

    saveCastToStorage(castData)
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

      await new Promise((resolve) => setTimeout(resolve, 1000))

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

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockUser: FarcasterUser = {
      fid: 12345,
      username: "alice",
      displayName: "Alice Johnson",
      pfpUrl: "/placeholder.svg?height=40&width=40",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6", // Mock Farcaster wallet
    }

    setUser(mockUser)
    localStorage.setItem("farcaster-user", JSON.stringify(mockUser))
    setShowSignIn(false)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkToPlay.trim() || !isValidUrl || !embedType) return

    // Only show payment dialog if donation is checked
    if (isDonationChecked) {
      setShowPaymentDialog(true)
    } else {
      // Create cast without payment
      setIsSubmitting(true)
      try {
        const castData = await createCast(linkToPlay, embedUrl, embedType, coverPhoto, title)
        await new Promise((resolve) => setTimeout(resolve, 1500))

        console.log("Cast created without payment:", castData)
        alert(
          `🎵 Cast created! Your ${embedType.charAt(0).toUpperCase()}${embedType.slice(1)} play button has been added to Farcaster.`,
        )

        // Reset form
        setLinkToPlay("")
        setEmbedUrl("")
        setEmbedType(null)
        setIsValidUrl(false)
        setCoverPhoto("")
        setTitle("")
      } catch (error) {
        console.error("Error creating cast:", error)
        alert("Failed to create cast. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setWalletState({ type: null, address: "", isConnected: false })
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

                  {/* Cover Photo Section */}
                  <div className="space-y-2">
                    <Label>Cover Photo (Optional)</Label>
                    {coverPhoto ? (
                      <div className="relative">
                        <img
                          src={coverPhoto || "/placeholder.svg"}
                          alt="Cover photo"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeCoverPhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => setShowImagePicker(true)}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Choose
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Upload an image (max 100MB) or choose from your Farcaster storage
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>

                  {/* Title Section */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter a title for your cast"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500">Add a custom title to describe your music or video</p>
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
                  <CardDescription>Click on any cast to open the media player</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCasts.map((cast) => (
                      <div
                        key={cast.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleCastClick(cast)}
                      >
                        <div className="flex items-center gap-3">
                          {cast.coverPhoto && (
                            <img
                              src={cast.coverPhoto || "/placeholder.svg"}
                              alt="Cover"
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium">
                                  {cast.title ||
                                    `${cast.embedType.charAt(0).toUpperCase() + cast.embedType.slice(1)} ${cast.embedType === "youtube" ? "Video" : "Track"}`}
                                </span>
                                {cast.paymentTxHash && (
                                  <CheckCircle className="h-3 w-3 text-green-600" title="Payment confirmed" />
                                )}
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {new Date(cast.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
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

        {/* Image Picker Dialog */}
        <Dialog open={showImagePicker} onOpenChange={setShowImagePicker}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Choose from Farcaster Storage</DialogTitle>
              <DialogDescription>Select an image from your previously uploaded files</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {storedImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No images in your Farcaster storage yet.</p>
                  <p className="text-sm">Upload some images to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {storedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageSelect(image.url)}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteStoredImage(image.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-75 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{image.name}</p>
                        <p>{formatFileSize(image.size)}</p>
                      </div>
                    </div>
                  ))}
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
                {currentCast?.title ||
                  `${currentCast?.embedType.charAt(0).toUpperCase()}${currentCast?.embedType.slice(1)} Player`}
              </DialogTitle>
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
                {currentCast?.paymentTxHash && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Payment Transaction:</p>
                    <a
                      href={`https://basescan.org/tx/${currentCast.paymentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline break-all"
                    >
                      {currentCast.paymentTxHash}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
