'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Music, Video, User, AlertCircle, Loader2, Settings, LogOut, Info, Upload, X, Gift, ChevronDown } from "lucide-react"
import { useFarcaster } from "@/hooks/use-farcaster"
import { PlayButtonCard } from "@/components/play-button-card"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation';
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal";
import SplashScreen from "@/components/splash-screen";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { sdk } from '@farcaster/miniapp-sdk';
import { buildShareText } from "@/lib/utils";

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
  const { user, isAuthenticated, isLoading, error: authError, signIn, signOut } = useFarcaster()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [activePlayButton, setActivePlayButton] = useState<PlayButton | null>(null);
  const [isDonating, setIsDonating] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>("farcaster");
  const [playButtons, setPlayButtons] = useState<PlayButton[]>([])

  useEffect(() => {
    const fetchPlayButtons = async () => {
      if (isAuthenticated) {
        try {
          const res = await api('/api/playbutton/all');
          if (res) {
            const parsed = res.map((pb: any) => ({
              ...pb,
              createdAt: new Date(pb.createdAt),
            }));
            setPlayButtons(parsed);
          } else {
            setPlayButtons([]);
            console.log('Could not fetch play buttons, maybe a new user?');
          }
        } catch (err) {
          console.error('Failed to fetch play buttons:', err);
        }
      } else {
        setPlayButtons([]);
      }
    };
    fetchPlayButtons();
  }, [isAuthenticated]);

  useEffect(() => {
    const fid = params.get('fid');
    const playButtonId = params.get('playButton');
    if (fid && playButtonId) {
      api(`/api/playbutton?fid=${fid}&id=${playButtonId}`)
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
    if (cleanUrl.includes("vimeo.com")) {
      const match = cleanUrl.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        const videoId = match[1];
        return { 
          platform: "Vimeo", 
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`, 
          oembedEndpoint: `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(cleanUrl)}` 
        };
      }
    }
    if (cleanUrl.includes("soundcloud.com")) {
      return { platform: "SoundCloud", embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`, oembedEndpoint: `https://soundcloud.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json` }
    }
    return null
  }

  const fetchOembedData = async (endpoint: string): Promise<OembedData> => {
    try {
      const data = await api(`/api/oembed?url=${encodeURIComponent(endpoint)}`);
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
      if (!detection) throw new Error("Unsupported platform. Please use Spotify, Apple Music, YouTube, SoundCloud, or Vimeo links.")
      
      let oembedData: OembedData = {};
      let imageUrl: string | undefined;
      
      if (detection.platform === "Apple Music") {
        const metadata = await api(`/api/metadata?url=${encodeURIComponent(url)}`);
        console.log('Apple Music metadata:', metadata);
        oembedData.title = metadata.title;
        imageUrl = metadata.imageUrl;
      } else if (detection.oembedEndpoint) {
        oembedData = await fetchOembedData(detection.oembedEndpoint);
        imageUrl = oembedData.thumbnail_url;
      }
      
      let artist = oembedData.author_name || "";
      // Only parse artist from title if we don't already have an author_name
      if (detection.platform === "Apple Music" && oembedData.title && !artist) {
        const byParts = oembedData.title.split(" by ");
        if (byParts.length > 1) {
          artist = byParts.pop()?.trim() || '';
          oembedData.title = byParts.join(" by ").trim();
        }
      }
      
      const suggestedTitle = oembedData.title || `My ${detection.platform} Mix`;

      setTitle(suggestedTitle)
      console.log('Setting cover image:', { imageUrl, platform: detection.platform });
      setCoverImage(imageUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz'}/ThePlayButton.png`);
      
      return { 
        platform: detection.platform, 
        embedUrl: detection.embedUrl, 
        suggestedTitle, 
        artist, 
        coverImage: imageUrl
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed. Please enter a valid URL."
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
      
      await api('/api/playbutton', {
        method: 'POST',
        body: {
          id: newPlayButton.id,
          data: newPlayButton,
        },
      });
      
      // Create the shareable cast with the share page URL as embed
      toast.success(`${validated.platform} play button added! Creating shareable cast...`)
      
      const shareText = buildShareText({ title: newPlayButton.title, artist: newPlayButton.artist, platform: newPlayButton.platform, includeEmoji: true });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
      const frameUrl = `${appUrl}/share/${encodeURIComponent(newPlayButton.id)}?fid=${user?.fid}`;
      
      const sharingResult = await sdk.actions.composeCast({ 
        text: shareText, 
        embeds: [frameUrl] 
      });
      
      if (sharingResult.cast) {
        toast.success('Cast published! The miniapp card should appear in feeds.');
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
      
      await api(`/api/playbutton?id=${id}`, {
        method: 'DELETE'
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



  const handleSignOut = async () => {
    await signOut();
  }

  const handleDonate = async (walletType: string = selectedWallet) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to donate");
      return;
    }

    setIsDonating(true);
    try {
      const recipientAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
      if (!recipientAddress) {
        toast.error("Donation address is not configured.");
        setIsDonating(false);
        return;
      }

      if (walletType === "farcaster") {
        const provider = await sdk.wallet.getEthereumProvider();
        if (!provider) {
          throw new Error("Farcaster Wallet provider not available.");
        }
        
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || !accounts[0]) {
          throw new Error("Could not connect to Farcaster Wallet.");
        }
        const fromAddress = accounts[0];

        const usdcContractAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
        const amount = 1000000; // 1 USDC (6 decimals)
        
        const paddedAddress = recipientAddress.slice(2).padStart(64, '0');
        const paddedAmount = amount.toString(16).padStart(64, '0');
        const txData = `0xa9059cbb${paddedAddress}${paddedAmount}`;

        const txParams = {
          from: fromAddress as `0x${string}`,
          to: usdcContractAddress as `0x${string}`,
          value: '0x0' as `0x${string}`,
          data: txData as `0x${string}`,
        };
        
        await provider.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });

        toast.success('Payment sent via Farcaster Wallet! 💜');

      } else if (walletType === "coinbase") {
        const { ethereum } = window as any;
        if (typeof window !== "undefined" && ethereum && ethereum.isCoinbaseWallet) {
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }], // 0x2105 is hex for 8453
            });

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const fromAddress = accounts[0];
            const usdcContractAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
            const amount = 1000000;
            const paddedAddress = recipientAddress.slice(2).padStart(64, '0');
            const paddedAmount = amount.toString(16).padStart(64, '0');
            const txData = `0xa9059cbb${paddedAddress}${paddedAmount}`;
            const txParams = { from: fromAddress as `0x${string}`, to: usdcContractAddress as `0x${string}`, value: '0x0' as `0x${string}`, data: txData as `0x${string}` };
            
            await ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });
            toast.success('Payment sent via Coinbase Wallet! 💜');
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              toast.error('Please add the Base network to your Coinbase Wallet and try again.');
            } else {
              toast.error('Failed to switch network. Please ensure you are on the Base network.');
            }
          }
        } else {
          const encodedAddress = encodeURIComponent(recipientAddress);
          const paymentUrl = `https://go.cb-w.com/send?address=${encodedAddress}&asset=USDC&amount=1&chain_id=8453`;
          await sdk.actions.openUrl(paymentUrl);
          toast.success(`Opening Coinbase Wallet... 💜`);
        }
      } else if (walletType === "walletconnect") {
        const encodedRecipient = encodeURIComponent(recipientAddress);
        const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        const paymentUrl = `https://app.uniswap.org/swap?chain=base&outputCurrency=${usdcAddress}&exactAmount=1&recipient=${encodedRecipient}`;
        await sdk.actions.openUrl(paymentUrl);
        toast.success(`Opening WalletConnect... 💜`);
      } else {
        throw new Error("Invalid wallet type selected.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment.';
      console.error('Payment error:', error);
      toast.error(message);
    } finally {
      setIsDonating(false);
    }
  }

  if (isLoading) return <SplashScreen />

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
            <Avatar className="w-12 h-12 cursor-pointer" onClick={isAuthenticated ? signOut : signIn}>
              <AvatarImage src={user?.pfpUrl || '/placeholder-user.jpg'} alt={user?.displayName || 'User'} />
              <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
            </Avatar>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create shareable cards for music and video links that play in the miniapp window without leaving Farcaster. Support for Spotify, Apple Music, YouTube, Vimeo, and SoundCloud.
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
              <Button onClick={signIn} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>) : (<><User className="w-4 h-4 mr-2" />Get Started</>)}
              </Button>
              {authError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{authError}</AlertDescription></Alert>}
              <Alert><Info className="h-4 w-4" /><AlertDescription>This app works best when opened from within Farcaster. If you're testing outside of Farcaster, a demo mode will be used.</AlertDescription></Alert>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full"><Settings className="w-4 h-4 mr-2" />Debug Info</Button>
              {showDebug && <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1"><div>Loading: {isLoading ? "Yes" : "No"}</div><div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div><div>User: {user ? user.username : "None"}</div><div>Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}</div><div>In Frame: {typeof window !== "undefined" && window.self !== window.top ? "Yes" : "No"}</div></div>}
            </CardContent>
          </Card>
        ) : (
          null
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5" />Add New Play Button</CardTitle>
            <CardDescription>Paste a link from Spotify, Apple Music, YouTube, SoundCloud, or Vimeo. Share and drive traffic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-gray-700">Music or Video URL <span className="text-red-500">*</span></label>
              <Input id="url-input" placeholder="" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full" disabled={isValidating} onBlur={() => url.trim() && validateUrl(url)} />
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

        {/* Donation Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Support the App!
            </CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-60">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Wallet:</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-full flex justify-between">
                        {selectedWallet === "farcaster" && "Farcaster Wallet"}
                        {selectedWallet === "coinbase" && "Coinbase Wallet"}
                        {selectedWallet === "walletconnect" && "WalletConnect"}
                        <ChevronDown className="w-3 h-3 ml-1 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setSelectedWallet("farcaster")}>Farcaster Wallet</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedWallet("coinbase")}>Coinbase Wallet</DropdownMenuItem>
                      {/* <DropdownMenuItem onClick={() => setSelectedWallet("walletconnect")}>WalletConnect</DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => handleDonate(selectedWallet)} 
                  disabled={!isAuthenticated || isDonating}
                  className="bg-purple-600 hover:bg-purple-700 w-60"
                >
                  {isDonating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Donate $1 USDC
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex justify-center">
                <div className="w-60">
                  <p className="text-xs font-medium text-gray-700 mb-1">USDC Address (Base):</p>
                  <code className="block text-xs bg-white p-2 rounded border font-mono break-all w-full text-left">
                    {process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000"}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000");
                      toast.success("Address copied to clipboard");
                    }}
                    className="text-xs w-full mt-2"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
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
      
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              I'm just a dude makin' stuff for creators. <a href="https://farcaster.xyz/derekhoiem" target="_blank">@derekhoiem</a>
              <br></br>
              <a href="https://github.com/bluedrums/AddPlayButton-Feedback/issues" target="_blank">Send me product feedback/bugs</a>
            </p>
            <p className="text-xs text-gray-500">
              No, we're not training AI. No, we don't sell your info.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <a href="https://www.rainonmeproductions.com/privacy-policy" className="text-gray-500 hover:text-gray-700 underline" target="_blank">Privacy Policy</a>
              <span className="text-gray-400">/</span>
              <a href="https://www.rainonmeproductions.com/terms-of-use" className="text-gray-500 hover:text-gray-700 underline" target="_blank">Terms of Use</a>
            </div>
            <p className="text-xs text-gray-400">
              © 2025<a href="https://www.rainonmeproductions.com" className="text-gray-500 hover:text-gray-700 underline" target="_blank">Rain On Me Productions LLC</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
