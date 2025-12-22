'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Play, Music, Video, User, AlertCircle, Loader2, Settings, LogOut, Info, Upload, X, Gift } from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"
import { PlayButtonCard } from "@/components/play-button-card"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation';
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { sdk } from '@farcaster/miniapp-sdk';
import { buildShareText } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Checkbox } from "@/components/ui/checkbox";
import { PlaylistCombobox } from "@/components/playlist-combobox";
import { useWallet } from "@/hooks/use-wallet";
import { useClientContext } from "@/hooks/use-client-context";
import { useCastDeepLink } from "@/hooks/use-cast-deep-link";

// Base Pay API types
declare global {
  interface Window {
    base?: {
      pay: (request: {
        recipient: string;
        amount: string;
        currency: string;
        chainId: number;
        reference?: string;
      }) => Promise<{ success: boolean; error?: string; txHash?: string }>;
    };
  }
}

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

interface Playlist {
    id: number;
    name: string;
    play_buttons?: PlayButton[];
}

interface OembedData {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

export default function ClientPage() {
  const params = useSearchParams();
  const { user, isAuthenticated, isLoading, error: authError, signIn, signOut, playButtons, setPlayButtons, refreshPlayButtons } = useFarcaster()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [activePlayButton, setActivePlayButton] = useState<PlayButton | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addToPlaylist, setAddToPlaylist] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [playlistContext, setPlaylistContext] = useState<{
    playlist: Playlist | null;
    currentIndex: number;
    isFromCast: boolean;
  } | null>(null);


  const [urlValidationTimeout, setUrlValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const defaultSafeArea = { top: 0, bottom: 0, left: 0, right: 0 };
  const [safeArea, setSafeArea] = useState(defaultSafeArea);
  const { setFrameReady } = useMiniKit();
  const { sendUSDC, isProcessing: isWalletProcessing, clientType, isBase } = useWallet();
  const { isLoading: isClientLoading } = useClientContext();

  // Deep link handling via SDK context - monitors for changes when app is already open
  useCastDeepLink({
    onPlayButtonFound: (playButton) => {
      setActivePlayButton(playButton);
      setIsPlayerModalOpen(true);
    },
    onPlaylistFound: (playlistData, startIndex) => {
      const trackToPlay = playlistData.play_buttons![startIndex];
      setPlaylistContext({
        playlist: playlistData,
        currentIndex: startIndex,
        isFromCast: true
      });
      setActivePlayButton({
        ...trackToPlay,
        createdAt: new Date(trackToPlay.createdAt)
      });
      setIsPlayerModalOpen(true);
      toast.success(`Playing: ${trackToPlay.title}`);
    },
  });

  // Handle legacy playlist playback initiation from cast embed (no frameUrl)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let lastPath: string | null = null;

    const checkLegacyPlaylist = async () => {
      try {
        const context = await sdk.context;
        const currentPath = context.location?.type === 'cast_share' 
          ? context.location.cast?.hash 
          : null;

        // Only process if path changed
        if (currentPath === lastPath) return;
        lastPath = currentPath;

        // Check if we're in a cast_share context (legacy playlist case)
        if (context.location?.type === 'cast_share') {
          const fid = context.user?.fid;
          if (fid) {
            try {
              const playlistsData = await api('/api/playlists');
              if (playlistsData && playlistsData.length > 0) {
                const playlistToPlay = playlistsData[0];
                if (playlistToPlay.play_buttons && playlistToPlay.play_buttons.length > 0) {
                  const firstTrack = playlistToPlay.play_buttons[0];
                  setPlaylistContext({
                    playlist: playlistToPlay,
                    currentIndex: 0,
                    isFromCast: true
                  });
                  setActivePlayButton(firstTrack);
                  setIsPlayerModalOpen(true);
                  toast.success(`Playing playlist: ${playlistToPlay.name}`);
                }
              }
            } catch (error) {
              console.error('Failed to fetch playlists for playback:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check legacy playlist context:', error);
      }
    };

    // Check periodically for legacy playlist case
    intervalId = setInterval(checkLegacyPlaylist, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Call SDK ready when component mounts and authentication is resolved
  useEffect(() => {
    // Only call SDK ready when we're not loading anymore
    if (!isLoading) {
      // For Farcaster clients
      sdk.actions.ready().catch(err => {
        console.error('Failed to mark Farcaster SDK as ready:', err);
      });
      // For Base/OnchainKit clients
      setFrameReady();
    }
  }, [isLoading, setFrameReady]);

  useEffect(() => {
    const fid = params.get('fid');
    const playButtonId = params.get('playButton');
    if (fid && playButtonId) {
      // This logic is now handled by the SDK context deep link effect.
      // Kept for backward compatibility or direct URL access with params.
      console.log('Query param-based deep link found (fallback).');
      // Pass FID in headers, not as query parameter
      api(`/api/playbutton?id=${playButtonId}`, {
        headers: {
          'x-user-fid': fid
        }
      })
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


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (urlValidationTimeout) {
        clearTimeout(urlValidationTimeout);
      }
    };
  }, [urlValidationTimeout]);

  // Get safe area insets asynchronously
  useEffect(() => {
    const getSafeAreaInsets = async () => {
      try {
        const context = await sdk.context;
        if (context?.client?.safeAreaInsets && typeof context.client.safeAreaInsets.top === 'number') {
          setSafeArea(context.client.safeAreaInsets);
        }
      } catch (error) {
        console.warn('Failed to get safe area insets:', error);
      }
    };

    getSafeAreaInsets();
  }, []);

  // Debug: Log play buttons state
  useEffect(() => {
    console.log('🔵 Current play buttons in ClientPage:', playButtons.length);
    console.log('🔵 Play button IDs:', playButtons.map(pb => pb.id));
  }, [playButtons]);

  // Debug SDK context
  useEffect(() => {
    sdk.context.then(context => {
      console.log('SDK Context:', context);
      console.log('User:', context?.user);
      console.log('Client:', context?.client);
    }).catch(err => {
      console.error('SDK Context Error:', err);
    });
  }, []);

  // Trigger "Add Mini App" dialog on first launch
  useEffect(() => {
    const triggerAddMiniAppDialog = async () => {
      // Only show dialog if user is authenticated and it's their first visit
      if (isAuthenticated && user && !isLoading) {
        const hasSeenDialog = localStorage.getItem('addplaybutton-seen-dialog');

        if (!hasSeenDialog) {
          try {
            console.log('🎯 Triggering Add Mini App dialog for first-time user');

            // Small delay to ensure everything is ready
            setTimeout(async () => {
              try {
                // Try the standard method first
                if (sdk.actions.addMiniApp) {
                  await sdk.actions.addMiniApp();
                } else {
                  // Fallback: try other possible method names
                  console.log('Standard addMiniApp method not found, trying alternatives...');

                  // Some SDK versions might use different method names
                  if ((sdk.actions as any).showAddMiniApp) {
                    await (sdk.actions as any).showAddMiniApp();
                  } else if ((sdk.actions as any).openMiniAppDialog) {
                    await (sdk.actions as any).openMiniAppDialog();
                  } else {
                    console.warn('Add Mini App dialog method not found in SDK');
                  }
                }

                // Mark that user has seen the dialog
                localStorage.setItem('addplaybutton-seen-dialog', 'true');
                console.log('✅ Add Mini App dialog triggered successfully');

              } catch (error) {
                console.error('Failed to trigger Add Mini App dialog:', error);
                // Still mark as seen to avoid repeated attempts
                localStorage.setItem('addplaybutton-seen-dialog', 'true');
              }
            }, 1500); // Wait 1.5 seconds after app is ready

          } catch (error) {
            console.error('Error in addMiniApp dialog trigger:', error);
          }
        }
      }
    };

    triggerAddMiniAppDialog();
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    if (isAuthenticated) {
        fetchPlaylists();
    }
  }, [isAuthenticated]);

  const fetchPlaylists = async () => {
    try {
      const data = await api('/api/playlists');
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const detectPlatform = (url: string): { platform: string; embedUrl: string; oembedEndpoint?: string } | null => {
    const cleanUrl = url.trim()
    if (cleanUrl.includes("spotify.com") || cleanUrl.includes("spoti.fi")) {
      const trackMatch = cleanUrl.match(/track\/([a-zA-Z0-9]+)/)
      const albumMatch = cleanUrl.match(/album\/([a-zA-Z0-9]+)/)
      const playlistMatch = cleanUrl.match(/playlist\/([a-zA-Z0-9]+)/)
      const episodeMatch = cleanUrl.match(/episode\/([a-zA-Z0-9]+)/)
      const showMatch = cleanUrl.match(/show\/([a-zA-Z0-9]+)/)
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`
      if (trackMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/track/${trackMatch[1]}`, oembedEndpoint: oembedUrl }
      if (albumMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/album/${albumMatch[1]}`, oembedEndpoint: oembedUrl }
      if (playlistMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`, oembedEndpoint: oembedUrl }
      if (episodeMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/episode/${episodeMatch[1]}`, oembedEndpoint: oembedUrl }
      if (showMatch) return { platform: "Spotify", embedUrl: `https://open.spotify.com/embed/show/${showMatch[1]}`, oembedEndpoint: oembedUrl }
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
      else if (cleanUrl.includes("youtube.com/shorts")) {
        const match = cleanUrl.match(/youtube\.com\/shorts\/([^?&]+)/);
        if (match) videoId = match[1];
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
    if (cleanUrl.includes("mixcloud.com")) {
      return { platform: "Mixcloud", embedUrl: `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(cleanUrl)}&hide_cover=1&autoplay=1` }
    }
    if (cleanUrl.includes("suno.com")) {
      // Suno URLs: https://suno.com/s/{short-id} (short format - will be converted to UUID during validation)
      // Suno URLs: https://suno.com/song/{uuid} (full format with UUID)
      // Embed URLs: https://suno.com/embed/{uuid} (requires UUID, not short ID)
      // Note: Short URLs are accepted as input but will be converted to UUID format during validation
      const songMatch = cleanUrl.match(/suno\.com\/s\/([a-zA-Z0-9]+)/i)
      if (songMatch && songMatch[1]) {
        const songId = songMatch[1]
        // Initial embed URL with short ID - will be updated to UUID format during validation
        return { platform: "Suno", embedUrl: `https://suno.com/embed/${songId}` }
      }
      // Also check if it's already an embed URL
      const embedMatch = cleanUrl.match(/suno\.com\/embed\/([a-zA-Z0-9]+)/i)
      if (embedMatch && embedMatch[1]) {
        return { platform: "Suno", embedUrl: cleanUrl }
      }
      // Legacy support for /song/ format (UUID)
      const legacySongMatch = cleanUrl.match(/suno\.com\/song\/([a-f0-9-]+)/i)
      if (legacySongMatch && legacySongMatch[1]) {
        const songId = legacySongMatch[1]
        return { platform: "Suno", embedUrl: `https://suno.com/embed/${songId}` }
      }
    }
    if (cleanUrl.includes("bandcamp.com")) {
      // Bandcamp URLs can be album or track URLs
      // We'll use the original URL in the embed player format
      // Bandcamp embed format: https://bandcamp.com/EmbeddedPlayer/?url={encoded-url}
      return { 
        platform: "Bandcamp", 
        embedUrl: `https://bandcamp.com/EmbeddedPlayer/?url=${encodeURIComponent(cleanUrl)}&size=large&bgcol=ffffff&linkcol=7137dc&transparent=true`,
        oembedEndpoint: `https://bandcamp.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`
      }
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
      if (!detection) throw new Error("Unsupported platform. Please use Spotify, Apple Music, YouTube, SoundCloud, Vimeo, Suno, Bandcamp, or Mixcloud links.")
      
      let oembedData: OembedData = {};
      let imageUrl: string | undefined;
      
      if (detection.platform === "Apple Music" || detection.platform === "Mixcloud" || detection.platform === "Suno") {
        const metadata = await api(`/api/metadata?url=${encodeURIComponent(url)}`);
        console.log(`${detection.platform} metadata:`, metadata);
        oembedData.title = metadata.title;
        imageUrl = metadata.imageUrl;
        if (metadata.artist) {
          oembedData.author_name = metadata.artist;
        }
        
        // For Suno, if we have a UUID in the metadata, update the embed URL
        // This converts short ID format (suno.com/s/{short-id}) to UUID format (suno.com/embed/{uuid})
        // The original short URL is preserved in the 'url' field, while embedUrl uses UUID for embedding
        if (detection.platform === "Suno" && metadata.uuid) {
          detection.embedUrl = `https://suno.com/embed/${metadata.uuid}`;
          console.log(`Updated Suno embed URL with UUID:`, detection.embedUrl);
        }
      } else if (detection.platform === "Bandcamp") {
        // Bandcamp: Try oEmbed first, then fall back to metadata API if no thumbnail
        try {
          oembedData = await fetchOembedData(detection.oembedEndpoint!);
          imageUrl = oembedData.thumbnail_url;
          console.log(`Bandcamp oEmbed result:`, { thumbnail_url: imageUrl, title: oembedData.title });
        } catch (error) {
          console.warn('Bandcamp oEmbed failed, trying metadata API:', error);
        }
        
        // Fallback to metadata API if oEmbed didn't return a thumbnail
        if (!imageUrl) {
          try {
            const metadata = await api(`/api/metadata?url=${encodeURIComponent(url)}`);
            console.log(`Bandcamp metadata fallback:`, metadata);
            if (metadata.imageUrl) {
              imageUrl = metadata.imageUrl;
            }
            if (metadata.title && !oembedData.title) {
              oembedData.title = metadata.title;
            }
            if (metadata.artist) {
              oembedData.author_name = metadata.artist;
            }
          } catch (error) {
            console.warn('Bandcamp metadata API also failed:', error);
          }
        }
      } else if (detection.oembedEndpoint) {
        oembedData = await fetchOembedData(detection.oembedEndpoint);
        imageUrl = oembedData.thumbnail_url;
      }
      
      let artist = oembedData.author_name || "";
      if ((detection.platform === "Apple Music" || detection.platform === "Mixcloud") && oembedData.title && !artist) {
        if (detection.platform === "Apple Music") {
          const byParts = oembedData.title.split(" by ");
          if (byParts.length > 1) {
            artist = byParts.pop()?.trim() || '';
            oembedData.title = byParts.join(" by ").trim();
          }
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
      
      // Save to database first
      const savedPlayButton = await api('/api/playbutton', {
        method: 'POST',
        body: JSON.stringify({
          id: newPlayButton.id,
          data: newPlayButton,
        }),
      });
      
      // Add to playlist if selected
      if (addToPlaylist && selectedPlaylistId) {
        await api('/api/playlists/add-button', {
            method: 'POST',
            body: JSON.stringify({
                playlist_id: selectedPlaylistId,
                play_button_id: newPlayButton.id,
            }),
        });
      }

      // Clear form and refresh the list from database
      setUrl(""); setTitle(""); setCoverImage(null); setValidationError(""); setAddToPlaylist(false); setSelectedPlaylistId(null);
      await refreshPlayButtons();
      
      // Create the shareable cast with the share page URL as embed
      toast.success(`${validated.platform} play button added! Creating shareable cast...`)
      
      const shareText = buildShareText({ title: newPlayButton.title, artist: newPlayButton.artist, platform: newPlayButton.platform, includeEmoji: true });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
      const frameUrl = `${appUrl}/share/${encodeURIComponent(newPlayButton.id)}`;
      
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
      console.log('🗑️ Removing play button with ID:', id);
      const playButton = playButtons.find(pb => pb.id === id);
      if (!playButton) {
        console.error('⚠️ Play button not found in local state:', id);
        return;
      }
      
      console.log('📡 Calling DELETE API for ID:', id);
      const deleteResult = await api(`/api/playbutton?id=${id}`, {
        method: 'DELETE'
      });
      console.log('✅ Delete API response:', deleteResult);
      
      // Refresh the list from database
      console.log('🔄 Refreshing play buttons after delete...');
      await refreshPlayButtons();
      
      toast.success('Play button removed!');
    } catch (error) {
      console.error('❌ Error removing play button:', error);
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

  const debugCheckDatabase = async () => {
    try {
      console.log('🔍 Checking database state with cache bust...');
      const cacheBustData = await api('/api/cache-bust');
      console.log('📋 Fresh database query:', cacheBustData);
      console.log('📊 DB count:', cacheBustData.count, 'DB records:', cacheBustData.records, 'Local total:', playButtons.length);
      
      // Check for missing IDs
      const localIds = new Set(playButtons.map(pb => pb.id));
      const dbIds = new Set(cacheBustData.data.map((pb: any) => pb.id));
      
      const missingInLocal = Array.from(dbIds).filter(id => !localIds.has(id as string));
      const missingInDb = Array.from(localIds).filter(id => !dbIds.has(id));
      
      console.log('🔴 Missing in local state:', missingInLocal);
      console.log('🔴 Missing in database:', missingInDb);
      console.log('📝 Database records:', cacheBustData.data);
      
      if (missingInLocal.length > 0 || cacheBustData.count !== playButtons.length) {
        console.log('⚠️ State mismatch detected! Count:', cacheBustData.count, 'vs Local:', playButtons.length);
        console.log('🔄 Force refreshing...');
        await refreshPlayButtons();
      }
    } catch (error) {
      console.error('❌ Debug check failed:', error);
    }
  }



  const handleSignOut = async () => {
    await signOut();
  }

  // Handle playlist track changes
  const handlePlaylistTrackChange = (newIndex: number) => {
    if (!playlistContext || !playlistContext.playlist) return;

    const { playlist } = playlistContext;

    if (newIndex >= 0 && playlist.play_buttons && newIndex < playlist.play_buttons.length) {
      const newTrack = playlist.play_buttons[newIndex];

      // Update playlist context
      setPlaylistContext({
        ...playlistContext,
        currentIndex: newIndex
      });

      // Update active play button
      setActivePlayButton(newTrack);
    }
  };

  /**
   * Unified donate handler that uses the SDK's wallet provider.
   * Automatically uses the correct wallet based on the client app context
   * (Base app wallet, Warpcast wallet, etc.)
   */
  const handleDonate = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to donate");
      return;
    }

    const recipientAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    if (!recipientAddress) {
      toast.error("Donation address is not configured.");
      return;
    }

    // Use the unified wallet hook to send USDC
    await sendUSDC(recipientAddress, 1);
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100">
      {activePlayButton && (
        <EmbeddedPlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => {
            setIsPlayerModalOpen(false);
            refreshPlayButtons();
            // Reset playlist context when modal closes
            setPlaylistContext(null);
          }}
          playButton={activePlayButton}
          safeArea={safeArea}
          playlistContext={playlistContext ? {
            playlist: playlistContext.playlist ? {
              id: playlistContext.playlist.id,
              name: playlistContext.playlist.name,
              play_buttons: playlistContext.playlist.play_buttons || []
            } : null,
            currentIndex: playlistContext.currentIndex,
            onTrackChange: handlePlaylistTrackChange,
            isFromCast: playlistContext.isFromCast
          } : undefined}
        />
      )}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img src="/appicon.jpg" alt="Add Play Button" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-[-1px] flex-1 text-center">Add Play Button</h1>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="w-12 h-12 cursor-pointer">
                    <AvatarImage src={user?.pfpUrl || '/placeholder-user.jpg'} alt={user?.displayName || 'User'} />
                    <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-gray-700">
                    <div className="font-medium">{user?.displayName}</div>
                    <div className="text-gray-500">@{user?.username}</div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Avatar className="w-12 h-12 cursor-pointer" onClick={signIn}>
                <AvatarImage src={'/placeholder-user.jpg'} alt={'User'} />
                <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
              </Avatar>
            )}
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create shareable cards for music and video links that play in the miniapp window.
          </p>
        </div>

        {!isAuthenticated ? (
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Connect with a miniapp client.
              </CardTitle>
              <CardDescription>Get started with a wallet to create and share play buttons. <a href="https://base.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Get the Base app here.</a></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="w-16 h-16">
                  <AvatarFallback><User className="w-8 h-8" /></AvatarFallback>
                </Avatar>
              </div>
              <Button onClick={signIn} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>) : (<><User className="w-4 h-4 mr-2" />Log In</>)}
              </Button>
              {authError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{authError}</AlertDescription></Alert>}
              <Alert><Info className="h-4 w-4" /><AlertDescription>This app only works when opened from within a supported miniapp client.</AlertDescription></Alert>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full"><Settings className="w-4 h-4 mr-2" />Debug Info</Button>
              {showDebug && <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1">
                <div>Loading: {isLoading ? "Yes" : "No"}</div>
                <div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
                <div>User: {user ? user.username : "None"}</div>
                <div>FID: {user ? user.fid : "None"}</div>
                <div>Play Buttons: {playButtons.length}</div>
                <div>Domain: {typeof window !== "undefined" ? window.location.hostname : "N/A"}</div>
                <div>In Frame: {typeof window !== "undefined" && window.self !== window.top ? "Yes" : "No"}</div>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={debugCheckDatabase}
                    className="flex-1"
                  >
                    Check DB
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={async () => {
                      console.log('🧹 Force clearing and refreshing...');
                      setPlayButtons([]);
                      await refreshPlayButtons();
                    }}
                    className="flex-1"
                  >
                    Force Refresh
                  </Button>
                </div>
              </div>}
            </CardContent>
          </Card>
        ) : (
          null
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5" />Add New Play Button</CardTitle>
            <CardDescription>Paste a link from Spotify, Apple Music, YouTube, Vimeo, Suno, Bandcamp, Mixcloud, and SoundCloud. Share and drive traffic everywhere.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-gray-700">Music or Video URL <span className="text-red-500">*</span></label>
              <Input 
                id="url-input" 
                placeholder="" 
                value={url} 
                onChange={(e) => {
                  const newUrl = e.target.value;
                  setUrl(newUrl);
                  
                  // Clear existing timeout
                  if (urlValidationTimeout) {
                    clearTimeout(urlValidationTimeout);
                  }
                  
                  // Set new timeout for 200ms
                  if (newUrl.trim()) {
                    const timeout = setTimeout(() => {
                      validateUrl(newUrl);
                    }, 200);
                    setUrlValidationTimeout(timeout);
                  }
                }} 
                className="w-full" 
                disabled={isValidating} 
                onBlur={() => {
                  // Clear timeout on blur to avoid duplicate validation
                  if (urlValidationTimeout) {
                    clearTimeout(urlValidationTimeout);
                    setUrlValidationTimeout(null);
                  }
                  // Still validate on blur if there's a URL
                  if (url.trim()) {
                    validateUrl(url);
                  }
                }} 
              />
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

            <Button onClick={handleAddPlayButton} disabled={isValidating || !url.trim() || !title.trim()} className="w-full bg-[#9234EB] hover:bg-[#9234EB]/90">
              {isValidating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Validating...</>) : (<><Play className="w-4 h-4 mr-2" />Add Play Button</>)}
            </Button>
            {validationError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{validationError}</AlertDescription></Alert>}
            
            {title && playlists.length > 0 && (
              <div className="space-y-2 pt-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="add-to-playlist"
                        checked={addToPlaylist}
                        onCheckedChange={(checked) => setAddToPlaylist(Boolean(checked))}
                    />
                    <label
                        htmlFor="add-to-playlist"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Add to Playlist
                    </label>
                </div>
                {addToPlaylist && (
                    <PlaylistCombobox
                        playlists={playlists}
                        selectedPlaylistId={selectedPlaylistId}
                        onSelect={setSelectedPlaylistId}
                    />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donation Card - Context-aware, uses the integrated wallet of the current client app */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Support the App!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button
                onClick={handleDonate}
                disabled={!isAuthenticated || isWalletProcessing || isClientLoading}
                className="w-full bg-[#5634EB] hover:bg-[#5634EB]/90"
              >
                {isWalletProcessing ? (
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
            <p className="text-xs text-gray-500 text-center mt-2">
              Sends via your {isBase ? "Base" : "Farcaster"} wallet
            </p>
          </CardContent>
        </Card>

        {playButtons.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2 mb-4 text-left">
              <Video className="w-5 h-5" />
              Your Play Buttons ({playButtons.length})
            </h2>
            <div className="space-y-4">
              {playButtons.map((playButton) => <PlayButtonCard key={playButton.id} playButton={playButton} onRemove={handleRemovePlayButton} />)}
            </div>
          </div>
        )}

        {playButtons.length === 0 && <Card><CardContent className="text-center py-12"><Music className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">No play buttons yet</h3><p className="text-gray-600">Add your first music or video link to get started!</p></CardContent></Card>}
      </div>
      
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              I'm just a dude makin' stuff for creators. <a href="https://farcaster.xyz/derekhoiem" className="text-gray-500 hover:text-gray-700 underline" target="_blank">@derekhoiem</a>
            </p>
            <p className="text-xs text-gray-500">              
              <a href="https://github.com/bluedrums/AddPlayButton-Feedback/issues" className="text-gray-500 hover:text-gray-700 underline" target="_blank">Send me product feedback/bugs</a>
            </p>
            <p className="text-xs text-gray-500">
              <a href="https://www.figma.com/community/plugin/1229731653276353355" className="text-gray-500 hover:text-gray-700 underline" target="_blank">Icons and logo by R4IN80W for 480 Design</a>
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
              © 2025 <a href="https://www.rainonmeproductions.com" className="text-gray-500 hover:text-gray-700 underline" target="_blank">Rain On Me Productions LLC</a>
            </p>
          </div>
        </div>
      </footer>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your Farcaster account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                signOut();
                setShowLogoutDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
