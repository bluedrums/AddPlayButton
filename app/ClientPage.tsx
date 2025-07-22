'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Music, Video, User, AlertCircle, Loader2, Settings, LogOut, Info, Upload, X } from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"
import { useFarcasterCast } from "@/hooks/use-farcaster-cast"
import { PlayButtonCard } from "@/components/play-button-card"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation';

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

export default function ClientPage() {
  const params = useSearchParams();
  const { user, isAuthenticated, isLoading, error: authError, signIn, signOut, isSDKReady } = useFarcaster()
  const { createPlayButtonCast, isCreating } = useFarcasterCast()
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
  const [sharedPlayButton, setSharedPlayButton] = useState<PlayButton | null>(null);

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

  useEffect(() => {
    if (isAuthenticated && user && !signerUuid) {
      const createSigner = async () => {
        try {
          const response = await fetch('/api/signer', { method: 'POST' });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create signer');
          }
          const data = await response.json();
          if (data.success) {
            setSignerUuid(data.signer_uuid);
            setSignerStatus(data.status);
            setSignerApprovalUrl(data.approval_url);
            // Auto-open approval URL for better UX
            if (data.approval_url && data.status === 'pending') {
              window.open(data.approval_url, '_blank');
              toast.info('Opening signer approval page... Please approve in your wallet.');
            }
          }
        } catch (error) {
          console.error('Failed to create signer:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to initialize signer. Please try signing in again.');
        }
      };
      createSigner();
    }
  }, [isAuthenticated, user, signerUuid]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (signerStatus === 'pending' && signerUuid) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/signer?signer_uuid=${signerUuid}`);
          if (!response.ok) throw new Error('Failed to check signer status');
          const data = await response.json();
          if (data.success && data.status === 'approved') {
            setSignerStatus('approved');
            toast.success('Signer approved!');
          }
        } catch (error) {
          console.error('Signer polling error:', error);
          toast.warning('Failed to check signer status. Retrying...');
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [signerStatus, signerUuid]);

  useEffect(() => {
    const fid = params.get('fid');
    const playButtonId = params.get('playButton');
    if (fid && playButtonId) {
      fetch(`/api/playbutton?fid=${fid}&playButton=${playButtonId}`)
        .then(res => res.json())
        .then(data => setSharedPlayButton({...data, createdAt: new Date(data.createdAt)}))
        .catch(() => toast.error('Failed to load shared play button'));
    }
  }, [params]);

  const savePlayButtons = (buttons: PlayButton[]) => {
    localStorage.setItem("playButtons", JSON.stringify(buttons))
  }

  const validateImage = (file: File): Promise<{ isValid: boolean; error?: string; dataUrl?: string }> => {
    return new Promise((resolve) => {
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        resolve({ isValid: false, error: "File size must be less than 10MB" })
        return
      }
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
          if (width < 600 || height < 400) {
            resolve({ isValid: false, error: "Image must be at least 600x400px" })
            return
          }
          if (width > 3000 || height > 2000) {
            resolve({ isValid: false, error: "Image must not exceed 3000x2000px" })
            return
          }
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
    const fileInput = document.getElementById("cover-image-input") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const detectPlatform = (url: string): { platform: string; embedUrl: string } | null => {
    const cleanUrl = url.trim()
    if (cleanUrl.includes("spotify.com") || cleanUrl.includes("spoti.fi")) {
      const trackMatch = cleanUrl.match(/track\/([a-zA-Z0-9]+)/)
      const albumMatch = cleanUrl.match(/album\/([a-zA-Z0-9]+)/)
      const playlistMatch = cleanUrl.match(/playlist\/([a-zA-Z0-9]+)/)
      if (trackMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/track/${trackMatch[1]}` }
      if (albumMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/album/${albumMatch[1]}` }
      if (playlistMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/playlist/${playlistMatch[1]}` }
    }
    if (cleanUrl.includes("music.apple.com") || cleanUrl.includes("apple.co")) {
      return { platform: "Apple Music", embedUrl: cleanUrl.replace("music.apple.com", "embed.music.apple.com") }
    }
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      let videoId = ""
      if (cleanUrl.includes("youtu.be/")) videoId = cleanUrl.split("youtu.be/")[1].split("?")[0]
      else if (cleanUrl.includes("youtube.com/watch")) {
        const match = cleanUrl.match(/[?&]v=([^&]+)/)
        if (match) videoId = match[1]
      }
      if (videoId) return { platform: "YouTube", embedUrl: `https://www.youtube.com/embed/${videoId}` }
    }
    if (cleanUrl.includes("soundcloud.com")) {
      return { platform: "SoundCloud", embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true` }
    }
    return null
  }

  const validateUrl = async (url: string) => {
    setIsValidating(true)
    setValidationError("")
    try {
      const detection = detectPlatform(url)
      if (!detection) throw new Error("Unsupported platform. Please use Spotify, Apple Music, YouTube, or SoundCloud links.")
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { platform: detection.platform, embedUrl: detection.embedUrl, suggestedTitle: `Sample ${detection.platform} Track`, artist: "Sample Artist" }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed"
      setValidationError(message)
      throw error
    } finally {
      setIsValidating(false)
    }
  }

  const handleAddPlayButton = async () => {
    if (!url.trim()) { setValidationError("Please enter a valid URL"); return }
    if (!title.trim()) { setValidationError("Please enter a title"); return }
    if (imageError) { setValidationError("Please fix the image error before proceeding"); return }
    try {
      const validated = await validateUrl(url)
      const newPlayButton = { id: Date.now().toString(), url: url.trim(), platform: validated.platform, title: title.trim(), artist: validated.artist, embedUrl: validated.embedUrl, coverImage: coverImage || undefined, createdAt: new Date() }
      // Save locally without backend cast
      const updatedButtons = [newPlayButton, ...playButtons]
      setPlayButtons(updatedButtons)
      savePlayButtons(updatedButtons)
      setUrl(""); setTitle(""); setCoverImage(null); setCoverImageFile(null); setValidationError(""); setImageError("")
      toast.success(`${validated.platform} play button added! Now cast it.`)
      // Optionally trigger composeCast here or let user click Cast button
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add play button';
      toast.error(message);
    }
  }

  const handleRemovePlayButton = async (id: string) => {
    const playButtonToDelete = playButtons.find(pb => pb.id === id);
    if (!playButtonToDelete) return;
    const jsonData = JSON.stringify({ deleted: id });
    const castResponse = await fetch('/api/cast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: jsonData, signerUuid }) });
    if (!castResponse.ok) throw new Error('Failed to delete play button');
    const updatedButtons = playButtons.filter((pb) => pb.id !== id)
    setPlayButtons(updatedButtons)
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

  if (!isSDKReady || isLoading) return <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center"><div className="text-center"><Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" /><p className="text-gray-600">Loading Farcaster SDK...</p></div></div>

  if (sharedPlayButton) return <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4"><div className="max-w-md w-full"><h1 className="text-2xl font-bold mb-4 text-center">Shared Play Button</h1><PlayButtonCard playButton={sharedPlayButton} /></div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add Play Button</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your music and video links into interactive play buttons for Farcaster. Support for Spotify, Apple Music, YouTube, and SoundCloud.
          </p>
        </div>

        {!isAuthenticated ? (
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Connect with Farcaster
              </CardTitle>
              <CardDescription>Get started with your Farcaster account to create and share play buttons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="w-16 h-16">
                  <AvatarFallback><User className="w-8 h-8" /></AvatarFallback>
                </Avatar>
              </div>
              <Button onClick={handleSignIn} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>) : (<><User className="w-4 h-4 mr-2" />Get Started</>)}
              </Button>
              {authError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{authError}</AlertDescription></Alert>}
              <Alert><Info className="h-4 w-4" /><AlertDescription>This app works best when opened from within Farcaster. If you're testing outside of Farcaster, a demo mode will be used.</AlertDescription></Alert>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full"><Settings className="w-4 h-4 mr-2" />Debug Info</Button>
              {showDebug && <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1"><div>SDK Ready: {isSDKReady ? "Yes" : "No"}</div><div>Loading: {isLoading ? "Yes" : "No"}</div><div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div><div>User: {user ? user.username : "None"}</div><div>Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}</div><div>In Frame: {typeof window !== "undefined" && window.self !== window.top ? "Yes" : "No"}</div></div>}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.pfpUrl || "/placeholder.svg"} alt={user?.displayName} />
                  <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                    <Badge variant="default" className="text-xs">{user?.fid === 12345 ? "Demo Mode" : "Connected"}</Badge>
                  </div>
                  <p className="text-gray-600">@{user?.username}</p>
                  {user?.bio && <p className="text-sm text-gray-500 mt-1">{user?.bio}</p>}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{user?.followerCount?.toLocaleString()} followers</span>
                    <span>{user?.followingCount?.toLocaleString()} following</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isAuthenticated && signerStatus === 'pending' && <Alert className="mb-4"><AlertDescription>Please approve the signer to enable casting: <Button variant="link" onClick={() => window.open(signerApprovalUrl || '', '_blank')}>Approve Signer</Button></AlertDescription></Alert>}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5" />Add New Play Button</CardTitle>
            <CardDescription>Paste a link from Spotify, Apple Music, YouTube, or SoundCloud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title-input" className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <Input id="title-input" placeholder="Enter a title for your play button..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" disabled={isValidating} />
            </div>
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-gray-700">Music or Video URL <span className="text-red-500">*</span></label>
              <Input id="url-input" placeholder="https://open.spotify.com/track/..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full" disabled={isValidating} onKeyDown={(e) => e.key === "Enter" && handleAddPlayButton()} />
            </div>
            <div className="space-y-2">
              <label htmlFor="cover-image-input" className="text-sm font-medium text-gray-700">Cover Image <span className="text-gray-500">(optional)</span></label>
              <div className="space-y-3">
                {!coverImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input id="cover-image-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isValidating} />
                    <label htmlFor="cover-image-input" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <div className="text-sm text-gray-600"><span className="font-medium text-purple-600 hover:text-purple-500">Click to upload</span> or drag and drop</div>
                      <div className="text-xs text-gray-500">3:2 aspect ratio • 600x400px to 3000x2000px • Max 10MB</div>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="aspect-[3/2] w-full max-w-md mx-auto rounded-lg overflow-hidden border">
                      <img src={coverImage || "/placeholder.svg"} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleRemoveImage} className="absolute top-2 right-2"><X className="w-4 h-4" /></Button>
                  </div>
                )}
                {imageError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{imageError}</AlertDescription></Alert>}
              </div>
            </div>
            <Button onClick={handleAddPlayButton} disabled={isValidating || !url.trim() || !title.trim() || !!imageError} className="w-full bg-purple-600 hover:bg-purple-700">
              {isValidating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Validating...</>) : (<><Play className="w-4 h-4 mr-2" />Add Play Button</>)}
            </Button>
            {validationError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{validationError}</AlertDescription></Alert>}
          </CardContent>
        </Card>

        {playButtons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Video className="w-5 h-5" />Your Play Buttons ({playButtons.length})</h2>
            {playButtons.map((playButton) => <PlayButtonCard key={playButton.id} playButton={playButton} onRemove={handleRemovePlayButton} />)}
          </div>
        )}

        {playButtons.length === 0 && <Card><CardContent className="text-center py-12"><Music className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">No play buttons yet</h3><p className="text-gray-600">Add your first music or video link to get started!</p></CardContent></Card>}
      </div>
    </div>
  );
} 