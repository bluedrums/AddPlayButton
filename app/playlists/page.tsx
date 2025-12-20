'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { ListMusic, PlusCircle, Trash2, Loader2, Share2, Plus, User, LogOut, Upload, Play, Gift, MoreHorizontal, Pencil, Copy } from 'lucide-react';
import { useFarcaster } from '@/components/farcaster-provider';
import { PlayButtonCard } from '@/components/play-button-card';
import { PlayButtonCombobox } from '@/components/play-button-combobox';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MainLayout } from '@/components/main-layout';
import sdk from '@farcaster/miniapp-sdk';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { useCastDeepLink } from "@/hooks/use-cast-deep-link";
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal";
// PlaylistIcon as a React component (SVG from components/icons/Icon/Filled/Playlist.svg)
const PlaylistIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 12C7.44772 12 7 12.4477 7 13C7 13.5523 7.44772 14 8 14H20C20.5523 14 21 13.5523 21 13C21 12.4477 20.5523 12 20 12H8ZM8 18C7.44772 18 7 18.4477 7 19C7 19.5523 7.44772 20 8 20H20C20.5523 20 21 19.5523 21 19C21 18.4477 20.5523 18 20 18H8ZM8 24C7.44772 24 7 24.4477 7 25C7 25.5523 7.44772 26 8 26H16C16.5523 26 17 25.5523 17 25C17 24.4477 16.5523 24 16 24H8Z" fill="white"/>
    <path d="M25.9585 15.8658L29.9963 14.6387C31.7871 14.0945 33 12.4289 33 10.5546V9.01682C33 7.66561 31.6878 6.66417 30.3721 7.10267L26.8425 8.27906C25.0033 8.89208 23.9585 10.943 23.9585 12.9847V24.7817H22.9723C20.1864 24.7817 18 27.1261 18 29.9272C18 31.5836 19.2972 33 20.9862 33C23.6335 33 25.7394 30.8831 25.9424 28.269H25.9585V15.8658Z" fill="white"/>
  </svg>
);

interface PlayButton {
    id: string;
    url: string;
    platform: string;
    title: string;
    artist?: string;
    embedUrl: string;
    coverImage?: string;
    createdAt: Date;
}

interface Playlist {
  id: number;
  name: string;
  created_at: string;
  play_buttons: PlayButton[];
}

interface PlaylistAutoAdvanceSettings {
  enabled: boolean;
  timeoutMinutes: number;
  loop?: boolean;
}

export default function PlaylistsPage() {
  const { isAuthenticated, user, signOut } = useFarcaster();
  const { sendUSDC, isProcessing: isWalletProcessing } = useWallet();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayButtons, setAllPlayButtons] = useState<PlayButton[]>([]);
  const [showAddButtonDialog, setShowAddButtonDialog] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [selectedPlayButtonId, setSelectedPlayButtonId] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [playlistContext, setPlaylistContext] = useState<{
    playlist: Playlist | null;
    currentIndex: number;
    autoAdvance?: PlaylistAutoAdvanceSettings;
  } | null>(null);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState<Map<number, boolean>>(new Map());
  const [loopEnabled, setLoopEnabled] = useState<Map<number, boolean>>(new Map());
  const [cardAutoAdvanceMinutes, setCardAutoAdvanceMinutes] = useState<Map<string, number>>(new Map());
  const [autoPlayPlaylistId, setAutoPlayPlaylistId] = useState<number | null>(null);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [playlistToShare, setPlaylistToShare] = useState<Playlist | null>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [playlistToRename, setPlaylistToRename] = useState<Playlist | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [activePlayButton, setActivePlayButton] = useState<PlayButton | null>(null);
  const defaultSafeArea = { top: 0, bottom: 0, left: 0, right: 0 };
  const [safeArea, setSafeArea] = useState(defaultSafeArea);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPlaylists();
      fetchAllPlayButtons();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Get safe area insets
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

  // Deep link handling via SDK context - monitors for changes when app is already open
  useCastDeepLink({
    onPlayButtonFound: (playButton) => {
      setActivePlayButton(playButton);
      setIsPlayerModalOpen(true);
    },
    onPlaylistFound: (playlistData, startIndex) => {
      const trackToPlay = playlistData.play_buttons![startIndex];
      const enabled = autoAdvanceEnabled.get(playlistData.id) ?? false;
      const loop = loopEnabled.get(playlistData.id) ?? false;
      const cardKey = `${playlistData.id}-${trackToPlay.id}`;
      const timeoutMinutes = cardAutoAdvanceMinutes.get(cardKey) ?? 4;
      
      setPlaylistContext({
        playlist: playlistData,
        currentIndex: startIndex,
        autoAdvance: { enabled, timeoutMinutes, loop }
      });
      setActivePlayButton({
        ...trackToPlay,
        createdAt: new Date(trackToPlay.createdAt)
      });
      setIsPlayerModalOpen(true);
      // Open the accordion item for this playlist
      setOpenAccordionItem(`item-${playlistData.id}`);
      toast.success(`Playing: ${trackToPlay.title}`);
    },
  });

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await api('/api/playlists');
      const updatedPlaylists = data.map((p: any) => ({
        ...p,
        play_buttons: (p.play_buttons || []).map((pb: any) => ({ ...pb, createdAt: new Date(pb.createdAt)}))
      }));
      setPlaylists(updatedPlaylists);

      // Populate cardAutoAdvanceMinutes from API response
      const timeoutMap = new Map<string, number>();
      updatedPlaylists.forEach((playlist: any) => {
        if (playlist.play_buttons) {
          playlist.play_buttons.forEach((pb: any) => {
            const key = `${playlist.id}-${pb.id}`;
            timeoutMap.set(key, pb.autoAdvanceTimeout ?? 4);
          });
        }
      });
      setCardAutoAdvanceMinutes(timeoutMap);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      toast.error('Failed to load playlists.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPlayButtons = async () => {
    try {
      const data = await api('/api/playbutton/all');
      setAllPlayButtons(data.map((pb: any) => ({ ...pb, createdAt: new Date(pb.createdAt) })));
    } catch (error) {
      console.error('Failed to fetch play buttons:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Playlist name cannot be empty.');
      return;
    }
    try {
      const newPlaylist = await api('/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: newPlaylistName }),
      });
      setPlaylists([newPlaylist, ...playlists]);
      setNewPlaylistName('');
      toast.success(`Playlist "${newPlaylist.name}" created!`);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist.');
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
        await api(`/api/playlists?id=${playlistId}`, {
            method: 'DELETE',
        });
        setPlaylists(playlists.filter((p) => p.id !== playlistId));
        toast.success('Playlist deleted.');
    } catch (error) {
        console.error('Failed to delete playlist:', error);
        toast.error('Failed to delete playlist.');
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: number, playButtonId: string) => {
    try {
        await api('/api/playlists/remove-button', {
            method: 'DELETE',
            body: JSON.stringify({ playlist_id: playlistId, play_button_id: playButtonId }),
        });

        // Refresh playlists to show the change
        fetchPlaylists();

        toast.success('Button removed from playlist.');
    } catch (error) {
        console.error('Failed to remove button from playlist:', error);
        toast.error('Failed to remove button from playlist.');
    }
  };

  const handleReorder = async (playlistId: number, playButtonId: string, direction: 'up' | 'down') => {
    // First, update local state immediately for smooth animation
    setPlaylists(prevPlaylists => {
      return prevPlaylists.map(playlist => {
        if (playlist.id !== playlistId || !playlist.play_buttons) {
          return playlist;
        }

        const buttons = [...playlist.play_buttons];
        const currentIndex = buttons.findIndex(pb => pb.id === playButtonId);
        
        if (currentIndex === -1) return playlist;
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        // Check bounds
        if (targetIndex < 0 || targetIndex >= buttons.length) {
          return playlist;
        }

        // Swap the items
        [buttons[currentIndex], buttons[targetIndex]] = [buttons[targetIndex], buttons[currentIndex]];

        return {
          ...playlist,
          play_buttons: buttons
        };
      });
    });

    // Then persist to server in background
    try {
      await api('/api/playlists/reorder', {
        method: 'POST',
        body: JSON.stringify({ playlist_id: playlistId, play_button_id: playButtonId, direction }),
      });
    } catch (error) {
      console.error('Failed to reorder playlist:', error);
      toast.error('Failed to reorder playlist. Refreshing...');
      // Revert by fetching fresh data on error
      fetchPlaylists();
    }
  };

  // Handle playlist track changes
  const handlePlaylistTrackChange = (newIndex: number) => {
    if (!playlistContext || !playlistContext.playlist) return;

    const { playlist } = playlistContext;

    if (newIndex >= 0 && playlist.play_buttons && newIndex < playlist.play_buttons.length) {
      // Update playlist context, preserving auto-advance settings
      setPlaylistContext({
        ...playlistContext,
        currentIndex: newIndex
      });
    }
  };

  const handleAddPlayButtonToPlaylist = async () => {
    if (!currentPlaylist || !selectedPlayButtonId) {
      toast.error('Please select a play button.');
      return;
    }
    try {
      await api('/api/playlists/add-button', {
        method: 'POST',
        body: JSON.stringify({
          playlist_id: currentPlaylist.id,
          play_button_id: selectedPlayButtonId,
        }),
      });

      // Refresh playlists to show the change
      fetchPlaylists();
      fetchAllPlayButtons();

      setShowAddButtonDialog(false);
      setCurrentPlaylist(null);
      setSelectedPlayButtonId(null);

      toast.success(`Play button added to "${currentPlaylist.name}"!`);
    } catch (error) {
      console.error('Failed to add play button to playlist:', error);
      toast.error('Failed to add play button to playlist.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  }

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (!playlist.play_buttons || playlist.play_buttons.length === 0) {
      toast.error('Cannot play an empty playlist.');
      return;
    }

    // Open the accordion item first so PlayButtonCard is rendered
    setOpenAccordionItem(`item-${playlist.id}`);

    // Get auto-advance enabled state for this playlist
    const enabled = autoAdvanceEnabled.get(playlist.id) ?? false;
    const loop = loopEnabled.get(playlist.id) ?? false;
    const firstTrackKey = `${playlist.id}-${playlist.play_buttons[0].id}`;
    const timeoutMinutes = cardAutoAdvanceMinutes.get(firstTrackKey) ?? 4;

    // Set playlist context to start playing from the first track
    setPlaylistContext({
      playlist: playlist,
      currentIndex: 0,
      autoAdvance: { enabled, timeoutMinutes, loop }
    });

    // Trigger auto-play on the first track
    setAutoPlayPlaylistId(playlist.id);
  };

  const handleAutoAdvanceToggle = (playlistId: number, enabled: boolean) => {
    setAutoAdvanceEnabled(prev => new Map(prev).set(playlistId, enabled));
    
    // Update playlist context if this playlist is currently playing
    if (playlistContext && playlistContext.playlist?.id === playlistId) {
      const loop = loopEnabled.get(playlistId) ?? false;
      setPlaylistContext({
        ...playlistContext,
        autoAdvance: {
          enabled,
          timeoutMinutes: playlistContext.autoAdvance?.timeoutMinutes ?? 4,
          loop
        }
      });
    }
  };

  const handleLoopToggle = (playlistId: number, enabled: boolean) => {
    setLoopEnabled(prev => new Map(prev).set(playlistId, enabled));
    
    // Update playlist context if this playlist is currently playing
    if (playlistContext && playlistContext.playlist?.id === playlistId) {
      setPlaylistContext({
        ...playlistContext,
        autoAdvance: {
          enabled: playlistContext.autoAdvance?.enabled ?? false,
          timeoutMinutes: playlistContext.autoAdvance?.timeoutMinutes ?? 4,
          loop: enabled
        }
      });
    }
  };

  const handleCardTimeoutMinutesChange = async (playlistId: number, playButtonId: string, minutes: number) => {
    const key = `${playlistId}-${playButtonId}`;
    // Update local state immediately
    setCardAutoAdvanceMinutes(prev => new Map(prev).set(key, minutes));
    
    // Persist to server
    try {
      await api('/api/playlists/update-timeout', {
        method: 'POST',
        body: JSON.stringify({
          playlist_id: playlistId,
          play_button_id: playButtonId,
          timeout_minutes: minutes
        })
      });
    } catch (error) {
      console.error('Failed to save auto-advance timeout:', error);
      toast.error('Failed to save timeout value.');
    }
  };

  // Keyboard navigation handler for accordion header icons
  const handleIconKeyDown = (
    e: React.KeyboardEvent,
    currentIndex: number,
    totalIcons: number,
    onActivate: () => void
  ) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      
      const iconContainer = (e.currentTarget as HTMLElement).parentElement;
      if (!iconContainer) return;
      
      const icons = Array.from(iconContainer.querySelectorAll<HTMLElement>('[data-icon-index]'));
      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = (currentIndex + direction + totalIcons) % totalIcons;
      const nextIcon = icons[nextIndex];
      
      if (nextIcon) {
        nextIcon.focus();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onActivate();
    }
  };

  // Opens the donate dialog before sharing
  const handleSharePlaylist = (playlist: Playlist) => {
    if (!playlist.play_buttons || playlist.play_buttons.length === 0) {
      toast.error('Cannot share an empty playlist.');
      return;
    }
    setPlaylistToShare(playlist);
    setShowDonateDialog(true);
  };

  // Actually shares the playlist via compose cast
  // Uses the centralized share route with playlist context in query params
  const executeSharePlaylist = async (playlist: Playlist) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    
    // Farcaster/Base allows up to 2 embeds per cast
    const maxEmbeds = Math.min(playlist.play_buttons.length, 2);
    const embedUrls: string[] = [];
    
    for (let i = 0; i < maxEmbeds; i++) {
      const playButton = playlist.play_buttons[i];
      // Create a share URL with playlist context
      const embedUrl = `${baseUrl}/share/${encodeURIComponent(playButton.id)}?playlistId=${playlist.id}&startIndex=${i}`;
      embedUrls.push(embedUrl);
    }

    // Cast text with playlist name at the top
    const castText = `🎵 ${playlist.name}`;

    try {
      // Use Farcaster SDK to create cast with playlist name and embed cards
      await sdk.actions.composeCast({
        text: castText,
        embeds: embedUrls as [string] | [string, string]
      });

      toast.success('Playlist shared successfully!');
    } catch (error) {
      console.error('Failed to share playlist:', error);
      toast.error('Failed to share playlist. Please try again.');
    }
  };

  // Handle donate and share
  const handleDonateAndShare = async () => {
    if (!playlistToShare) return;

    const recipientAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    if (!recipientAddress) {
      toast.error("Donation address is not configured.");
      return;
    }

    // Send $0.25 USDC donation
    const success = await sendUSDC(recipientAddress, 0.25);
    
    // Close dialog and share regardless of donation success
    setShowDonateDialog(false);
    await executeSharePlaylist(playlistToShare);
    setPlaylistToShare(null);
  };

  // Handle skip donation and just share
  const handleSkipDonation = async () => {
    if (!playlistToShare) return;
    
    setShowDonateDialog(false);
    await executeSharePlaylist(playlistToShare);
    setPlaylistToShare(null);
  };

  // Handle opening rename dialog
  const handleOpenRenameDialog = (playlist: Playlist) => {
    setPlaylistToRename(playlist);
    setRenameValue(playlist.name);
    setShowRenameDialog(true);
  };

  // Handle rename playlist
  const handleRenamePlaylist = async () => {
    if (!playlistToRename || !renameValue.trim()) {
      toast.error('Playlist name cannot be empty.');
      return;
    }
    try {
      await api(`/api/playlists?id=${playlistToRename.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      setPlaylists(playlists.map(p => 
        p.id === playlistToRename.id ? { ...p, name: renameValue.trim() } : p
      ));
      toast.success('Playlist renamed successfully!');
      setShowRenameDialog(false);
      setPlaylistToRename(null);
      setRenameValue('');
    } catch (error) {
      console.error('Failed to rename playlist:', error);
      toast.error('Failed to rename playlist.');
    }
  };

  // Handle opening delete confirmation dialog
  const handleOpenDeleteDialog = (playlist: Playlist) => {
    setPlaylistToDelete(playlist);
    setShowDeleteConfirmDialog(true);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!playlistToDelete) return;
    await handleDeletePlaylist(playlistToDelete.id);
    setShowDeleteConfirmDialog(false);
    setPlaylistToDelete(null);
  };

  // Handle copy embed code
  const handleCopyEmbedCode = (playlist: Playlist) => {
    if (!playlist.play_buttons || playlist.play_buttons.length === 0) {
      toast.error('Cannot copy embed code for an empty playlist.');
      return;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const maxEmbeds = Math.min(playlist.play_buttons.length, 2);
    const embedUrls: string[] = [];
    
    for (let i = 0; i < maxEmbeds; i++) {
      const playButton = playlist.play_buttons[i];
      const embedUrl = `${baseUrl}/share/${encodeURIComponent(playButton.id)}?playlistId=${playlist.id}&startIndex=${i}`;
      embedUrls.push(embedUrl);
    }
    
    const embedCode = embedUrls.join('\n');
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard!');
  };

  if (!isAuthenticated) {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Playlists</CardTitle>
                        <CardDescription>Please sign in to view your playlists.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </MainLayout>
    );
  }

  return (
    <MainLayout>
    <div className="bg-[#F9F5FF] min-h-screen">
      {activePlayButton && (
        <EmbeddedPlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => {
            setIsPlayerModalOpen(false);
            setActivePlayButton(null);
            // Don't reset playlistContext here as it might be used by PlayButtonCard
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
            isFromCast: true,
            autoAdvance: playlistContext.autoAdvance
          } : undefined}
        />
      )}
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#8A63D2] flex items-center justify-center">
                    <PlaylistIcon className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-[-1px] flex-1 text-center">Playlists</h1>
                {isAuthenticated && user ? (
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
                  <Avatar className="w-12 h-12">
                    <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                  </Avatar>
                )}
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
                Organize your play buttons into playlists.
            </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Create New Playlist
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="My Awesome Playlist"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <Button onClick={handleCreatePlaylist} className="bg-[#CE34EB] hover:bg-[#CE34EB]/90">Create</Button>
          </CardContent>
        </Card>

        {isLoading ? (
            <div className="flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        ) : playlists.length > 0 ? (
          <Accordion type="single" collapsible className="w-full" value={openAccordionItem} onValueChange={setOpenAccordionItem}>
            {playlists.map((playlist) => (
              <AccordionItem value={`item-${playlist.id}`} key={playlist.id} className="mb-[10px]">
                <AccordionTrigger className="bg-[#EAE6F0] rounded-lg pr-[10px]">
                    <div className="flex justify-between items-center w-full pr-4">
                        <span className="pl-[10px]">{playlist.name}</span>
                        <div className="flex gap-2" role="toolbar" aria-label="Playlist actions">
                            <div
                                role="button"
                                data-icon-index="0"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayPlaylist(playlist);
                                }}
                                onKeyDown={(e) => handleIconKeyDown(e, 0, 4, () => handlePlayPlaylist(playlist))}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 cursor-pointer text-black hover:text-gray-800"
                                aria-label="Play playlist"
                            >
                                <Play className="w-4 h-4" />
                            </div>
                            <div
                                role="button"
                                data-icon-index="1"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSharePlaylist(playlist);
                                }}
                                onKeyDown={(e) => handleIconKeyDown(e, 1, 4, () => handleSharePlaylist(playlist))}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 cursor-pointer text-black hover:text-gray-800"
                                aria-label="Share playlist"
                            >
                                <Upload className="w-4 h-4" />
                            </div>
                            <div
                                role="button"
                                data-icon-index="2"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPlaylist(playlist);
                                    setShowAddButtonDialog(true);
                                }}
                                onKeyDown={(e) => handleIconKeyDown(e, 2, 4, () => {
                                    setCurrentPlaylist(playlist);
                                    setShowAddButtonDialog(true);
                                })}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 cursor-pointer text-black hover:text-gray-800"
                                aria-label="Add button to playlist"
                            >
                                <Plus className="w-4 h-4" />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div
                                        role="button"
                                        data-icon-index="3"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const iconContainer = (e.currentTarget as HTMLElement).parentElement?.parentElement;
                                                if (!iconContainer) return;
                                                const icons = Array.from(iconContainer.querySelectorAll<HTMLElement>('[data-icon-index]'));
                                                const direction = e.key === 'ArrowLeft' ? -1 : 1;
                                                const currentIndex = parseInt((e.currentTarget as HTMLElement).getAttribute('data-icon-index') || '3');
                                                const nextIndex = (currentIndex + direction + 4) % 4;
                                                const nextIcon = icons[nextIndex];
                                                if (nextIcon) {
                                                    nextIcon.focus();
                                                }
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 cursor-pointer text-black hover:text-gray-800"
                                        aria-label="Playlist options"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenRenameDialog(playlist);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyEmbedCode(playlist);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Code
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDeleteDialog(playlist);
                                        }}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {/* Auto-Advance and Loop Controls */}
                    {playlist.play_buttons && playlist.play_buttons.length > 0 && (
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`auto-advance-${playlist.id}`}
                            checked={autoAdvanceEnabled.get(playlist.id) ?? false}
                            onCheckedChange={(checked) => handleAutoAdvanceToggle(playlist.id, checked === true)}
                          />
                          <Label htmlFor={`auto-advance-${playlist.id}`} className="text-sm font-medium cursor-pointer">
                            Auto Advance
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`loop-playlist-${playlist.id}`}
                            checked={loopEnabled.get(playlist.id) ?? false}
                            onCheckedChange={(checked) => handleLoopToggle(playlist.id, checked === true)}
                          />
                          <Label htmlFor={`loop-playlist-${playlist.id}`} className="text-sm font-medium cursor-pointer">
                            Loop Playlist
                          </Label>
                        </div>
                      </div>
                    )}
                    {playlist.play_buttons?.map((pb, index) => (
                      <div key={pb.id} className="transition-all duration-300 ease-in-out">
                        <PlayButtonCard
                            playButton={pb}
                            onRemove={(id) => handleRemoveFromPlaylist(playlist.id, id)}
                            autoPlay={index === 0 && autoPlayPlaylistId === playlist.id}
                            onAutoPlayStarted={() => setAutoPlayPlaylistId(null)}
                            onReorder={handleReorder}
                            playlistId={playlist.id}
                            currentIndex={index}
                            totalItems={playlist.play_buttons?.length || 0}
                            autoAdvanceSettings={{
                              enabled: autoAdvanceEnabled.get(playlist.id) ?? false,
                              timeoutMinutes: cardAutoAdvanceMinutes.get(`${playlist.id}-${pb.id}`) ?? 4
                            }}
                            onUpdateAutoAdvanceTimeout={(minutes) => handleCardTimeoutMinutesChange(playlist.id, pb.id, minutes)}
                            playlistContext={playlistContext && playlistContext.playlist?.id === playlist.id ? {
                              playlist: playlist,
                              currentIndex: playlistContext.currentIndex,
                              onTrackChange: handlePlaylistTrackChange,
                              autoAdvance: playlistContext.autoAdvance
                            } : {
                              playlist: playlist,
                              currentIndex: index,
                              onTrackChange: (newIndex: number) => {
                                // Initialize playlist context when clicking on a track in a playlist
                                const cardKey = `${playlist.id}-${playlist.play_buttons![newIndex].id}`;
                                const loop = loopEnabled.get(playlist.id) ?? false;
                                const settings = {
                                  enabled: autoAdvanceEnabled.get(playlist.id) ?? false,
                                  timeoutMinutes: cardAutoAdvanceMinutes.get(cardKey) ?? 4,
                                  loop
                                };
                                setPlaylistContext({
                                  playlist: playlist,
                                  currentIndex: newIndex,
                                  autoAdvance: settings
                                });
                              }
                            }}
                        />
                      </div>
                    ))}
                    {playlist.play_buttons?.length === 0 && (
                      <div className="flex justify-center pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => {
                            setCurrentPlaylist(playlist);
                            setShowAddButtonDialog(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Play Button
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <Card>
                <CardContent className="text-center py-12">
                    <ListMusic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No playlists yet</h3>
                    <p className="text-gray-600">Create your first playlist to get started!</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>

      {/* Add Play Button Dialog */}
      <Dialog open={showAddButtonDialog} onOpenChange={setShowAddButtonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Play Button to Playlist</DialogTitle>
            <DialogDescription>
              {currentPlaylist ? (
                <>Adding to <span className="font-semibold">"{currentPlaylist.name}"</span></>
              ) : (
                'Select a play button to add.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Play Button</label>
              <PlayButtonCombobox
                playButtons={allPlayButtons}
                selectedPlayButtonId={selectedPlayButtonId}
                onSelect={setSelectedPlayButtonId}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowAddButtonDialog(false);
              setCurrentPlaylist(null);
              setSelectedPlayButtonId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayButtonToPlaylist}>
              Add to Playlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
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

      {/* Donate Dialog for Sharing */}
      <AlertDialog open={showDonateDialog} onOpenChange={(open) => {
        if (!open && !isWalletProcessing) {
          setShowDonateDialog(false);
          setPlaylistToShare(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Support the App!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Keep this app running with a small donation. 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel 
              onClick={handleSkipDonation}
              disabled={isWalletProcessing}
            >
              No Thanks
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDonateAndShare}
              disabled={isWalletProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isWalletProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Donate $0.25 USDC
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Playlist Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRenameDialog(false);
          setPlaylistToRename(null);
          setRenameValue('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
            <DialogDescription>
              Enter a new name for your playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Playlist name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenamePlaylist()}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowRenameDialog(false);
              setPlaylistToRename(null);
              setRenameValue('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleRenamePlaylist} className="bg-[#CE34EB] hover:bg-[#CE34EB]/90">
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteConfirmDialog(false);
          setPlaylistToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{playlistToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

