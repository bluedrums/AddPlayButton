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
import { PlayButtonCard } from "@/components/play-button-card"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal";
import SplashScreen from "@/components/splash-screen";

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

interface OembedData {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

export default function ClientPage() {
  const params = useSearchParams();
  const { user, isAuthenticated, isLoading, error: authError, signIn, signOut, isSDKReady, setUser, playButtons, setPlayButtons } = useFarcaster()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [activePlayButton, setActivePlayButton] = useState<PlayButton | null>(null);

  useEffect(() => {
    if (isSDKReady) {
      sdk.actions.ready();
    }
  }, [isSDKReady]);

  useEffect(() => {
    const fid = params.get('fid');
    const playButtonId = params.get('playButton');
    if (fid && playButtonId) {
      fetch(`/api/playbutton?fid=${fid}&id=${playButtonId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            if (data.error === 'Play button not found') {
              toast.error('This play button was not found. It may have been deleted or is no longer available.');
            } else {
              toast.error(data.error);
            }
          } else {
            const pb = {...data, createdAt: new Date(data.createdAt)};
            setActivePlayButton(pb);
            setIsPlayerModalOpen(true);
          }
        })
        .catch((error) => {
          console.error('Failed to load shared play button:', error);
          toast.error('Failed to load shared play button. It may have been deleted or is no longer available.');
        });
    }
  }, [params]);

  const detectPlatform = (url: string): { platform: string; embedUrl: string; oembedEndpoint?: string } | null => {
    const cleanUrl = url.trim()
    if (cleanUrl.includes("spotify.com") || cleanUrl.includes("spoti.fi")) {
      const trackMatch = cleanUrl.match(/track\/([a-zA-Z0-9]+)/)
      const albumMatch = cleanUrl.match(/album\/([a-zA-Z0-9]+)/)
      const playlistMatch = cleanUrl.match(/playlist\/([a-zA-Z0-9]+)/)
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`
      if (trackMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/track/${trackMatch[1]}`, oembedEndpoint: oembedUrl }
      if (albumMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/album/${albumMatch[1]}`, oembedEndpoint: oembedUrl }
      if (playlistMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`, oembedEndpoint: oembedUrl }
    }
    if (cleanUrl.includes("music.apple.com") || cleanUrl.includes("apple.co")) {
      // Apple Music does not have a public oEmbed API
      return { platform: "Apple Music", embedUrl: cleanUrl.replace("music.apple.com", "embed.music.apple.com") }
    }
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      let videoId = ""
      if (cleanUrl.includes("youtu.be/")) videoId = cleanUrl.split("youtu.be/")[1].split("?")[0]
      else if (cleanUrl.includes("youtube.com/watch")) {
        const match = cleanUrl.match(/[?&]v=([^&]+)/)
        if (match) videoId = match[1]
      }
      if (videoId) return { platform: "YouTube", embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`, oembedEndpoint: `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json` }
    }
    if (cleanUrl.includes("soundcloud.com")) {
      return { platform: "SoundCloud", embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`, oembedEndpoint: `https://soundcloud.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json` }
    }
    return null
  }

  const fetchOembedData = async (endpoint: string): Promise<OembedData> => {
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(endpoint)}`)
      if (!res.ok) throw new Error('Failed to fetch oEmbed data');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("oEmbed fetch error:", error)
      // Return empty object on failure so the flow can continue
      return {}; 
    }
  }

  const validateUrl = async (url: string) => {
    setIsValidating(true)
    setValidationError("")
    setCoverImage(null)
    setTitle("")
    try {
      const detection = detectPlatform(url)
      if (!detection) throw new Error("Unsupported platform. Please use Spotify, Apple Music, YouTube, or SoundCloud links.")
      
      let oembedData: OembedData = {};
      if (detection.oembedEndpoint) {
        oembedData = await fetchOembedData(detection.oembedEndpoint);
      }
      
      const suggestedTitle = oembedData.title || `My ${detection.platform} Mix`;
      const artist = oembedData.author_name || "";
      const imageUrl = oembedData.thumbnail_url; // this can be string or undefined

      setTitle(suggestedTitle)
      // Set cover image for UI preview, with a fallback
      setCoverImage(imageUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz'}/ThePlayButton.png`);
      
      return { 
        platform: detection.platform, 
        embedUrl: detection.embedUrl, 
        suggestedTitle, 
        artist, 
        coverImage: imageUrl // Return the actual image URL (or undefined)
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
    if (!url.trim()) { setValidationError("Please enter a valid URL"); return }
    if (!title.trim()) { setValidationError("Please enter a title"); return }
    try {
      const validated = await validateUrl(url)
      const newPlayButton: PlayButton = { 
        id: Date.now().toString(), 
        url: url.trim(), 
        platform: validated.platform, 
        title: title.trim(), 
        artist: validated.artist, 
        embedUrl: validated.embedUrl, 
        coverImage: validated.coverImage, // Use directly from validation result
        createdAt: new Date() 
      }
      const updatedButtons = [newPlayButton, ...playButtons]
      setPlayButtons(updatedButtons)
      setUrl(""); setTitle(""); setCoverImage(null); setValidationError("");
      
      // Store on server for persistence
      const storeRes = await fetch('/api/playbutton', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newPlayButton.id,
          data: newPlayButton,
        }),
      });

      if (!storeRes.ok) {
        toast.error('Failed to store play button data');
        return;
      }
      
      // Create the shareable cast with the share page URL as embed
      toast.success(`${validated.platform} play button added! Creating shareable cast...`)
      let shareText = `🎵 ${newPlayButton.title}`;
/*       if (newPlayButton.artist) {
        shareText += ` by ${newPlayButton.artist}`;
      } */
      shareText += ` on ${newPlayButton.platform}`;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
      const frameUrl = `${appUrl}/share/${encodeURIComponent(newPlayButton.id)}?fid=${user?.fid}`;
      
      // Use the share URL as the embed - this will trigger Farcaster to fetch the meta tags from the dynamic HTML
      const sharingResult = await sdk.actions.composeCast({ 
        text: shareText, 
        embeds: [frameUrl] 
      });
      
      if (sharingResult.cast) {
        toast.success('Cast published! The miniapp card should appear in feeds.');
        // Removed storage cast to avoid dual casts
      } else {
        toast.info('Cast canceled');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add play button';
      toast.error(message);
    }
  }

  const handleRemovePlayButton = async (id: string) => {
    try {
      const playButton = playButtons.find(pb => pb.id === id);
      if (!playButton) return;
      
      const updatedButtons = playButtons.filter((pb) => pb.id !== id);
      setPlayButtons(updatedButtons);
      
      await fetch(`/api/playbutton?id=${id}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies in the request
      });
      
      toast.success('Play button removed!');
    } catch (error) {
      toast.error('Failed to remove play button');
    }
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

  const handleSignOut = async () => {
    await signOut();
    setUser(null); // Explicitly clear user state on the client
  }

  if (!isSDKReady || isLoading) return <SplashScreen />

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {activePlayButton && (
        <EmbeddedPlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => setIsPlayerModalOpen(false)}
          playButton={activePlayButton}
        />
      )}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img src="/appicon.jpg" alt="Add Play Button" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add Play Button</h1>
            <Avatar className="w-12 h-12 cursor-pointer" onClick={isAuthenticated ? handleSignOut : handleSignIn}>
              <AvatarImage src={user?.pfpUrl || '/placeholder-user.jpg'} alt={user?.displayName || 'User'} />
              <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
            </Avatar>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create shareable cards for music and video links that play in the miniapp window while in Farcaster. Support for Spotify, Apple Music, YouTube, and SoundCloud.
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
          null
        )}

        {/* {isAuthenticated && signerStatus === 'pending' && <Alert className="mb-4"><AlertDescription>Please approve the signer to enable casting: <Button variant="link" onClick={() => window.open(signerApprovalUrl || '', '_blank')}>Approve Signer</Button></AlertDescription></Alert>} */}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5" />Add New Play Button</CardTitle>
            <CardDescription>Paste a link from Spotify, Apple Music, YouTube, or SoundCloud. Share and drive traffic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-gray-700">Music or Video URL <span className="text-red-500">*</span></label>
              <Input id="url-input" placeholder="https://open.spotify.com/track/..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full" disabled={isValidating} onBlur={() => validateUrl(url)} />
            </div>

            {isValidating && <div className="flex items-center justify-center text-gray-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /><span>Fetching details...</span></div>}

            {title && (
              <>
                <div className="space-y-2">
                  <label htmlFor="title-input" className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                  <Input id="title-input" placeholder="Enter a title for your play button..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
                </div>
                {coverImage && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cover Image</label>
                    <div className="relative">
                      <div className="aspect-[3/2] w-full max-w-md mx-auto rounded-lg overflow-hidden border">
                        <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setCoverImage(null)} className="absolute top-2 right-2"><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <Button onClick={handleAddPlayButton} disabled={isValidating || !url.trim() || !title.trim()} className="w-full bg-purple-600 hover:bg-purple-700">
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