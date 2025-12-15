"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { Play, MessageSquare, MoreVertical, ExternalLink, Copy, Trash2, Calendar, ImageIcon, Music, Code, ListMusic, PlusCircle, ChevronUp, ChevronDown } from "lucide-react"
import { EmbeddedPlayerModal } from "@/components/embedded-player-modal"
import { useFarcaster } from "@/components/farcaster-provider"
import { toast } from "sonner"
import { sdk } from "@farcaster/miniapp-sdk";
import { buildShareText } from "@/lib/utils"
import { api } from "@/lib/api"
import { PlaylistCombobox } from "./playlist-combobox"
import { PlayButtonCombobox } from "./play-button-combobox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "@/components/ui/dialog"
  

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

interface PlaylistContext {
  playlist: Playlist | null;
  currentIndex: number;
  onTrackChange: (index: number) => void;
  autoAdvance?: {
    enabled: boolean;
    timeoutMinutes: number;
    loop?: boolean;
  };
}

interface PlayButtonCardProps {
  playButton: PlayButton
  onRemove?: (id: string) => void
  playlistContext?: PlaylistContext
  autoPlay?: boolean
  onAutoPlayStarted?: () => void
  onReorder?: (playlistId: number, playButtonId: string, direction: 'up' | 'down') => void
  playlistId?: number
  currentIndex?: number
  totalItems?: number
  autoAdvanceSettings?: {
    enabled: boolean;
    timeoutMinutes: number;
  }
  onUpdateAutoAdvanceTimeout?: (minutes: number) => void
}

export function PlayButtonCard({ playButton, onRemove, playlistContext, autoPlay, onAutoPlayStarted, onReorder, playlistId, currentIndex, totalItems, autoAdvanceSettings, onUpdateAutoAdvanceTimeout }: PlayButtonCardProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const [currentPlayButton, setCurrentPlayButton] = useState(playButton)
  const { isAuthenticated, user, refreshPlayButtons } = useFarcaster()
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);

  // Determine if playlist controls (reorder spinner, auto-advance) will be shown
  const hasReorderControls = onReorder && playlistId !== undefined && currentIndex !== undefined && totalItems !== undefined;
  const hasAutoAdvanceControls = (autoAdvanceSettings?.enabled ?? false) && onUpdateAutoAdvanceTimeout;
  const hasPlaylistControls = hasReorderControls || hasAutoAdvanceControls;

  // Auto-play when autoPlay prop is set to true
  useEffect(() => {
    if (autoPlay && !showPlayer) {
      setShowPlayer(true);
      if (onAutoPlayStarted) {
        onAutoPlayStarted();
      }
    }
  }, [autoPlay, showPlayer, onAutoPlayStarted]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);

  // Update current play button when playlist context changes
  useEffect(() => {
    if (playlistContext && playlistContext.playlist && playlistContext.playlist.play_buttons) {
      const newPlayButton = playlistContext.playlist.play_buttons[playlistContext.currentIndex];
      if (newPlayButton && newPlayButton.id !== currentPlayButton.id) {
        setCurrentPlayButton(newPlayButton);
        // Keep the player open when navigating tracks
        if (showPlayer) {
          // Player will be updated by the new playButton prop
        }
      }
    }
  }, [playlistContext, currentPlayButton.id, showPlayer]);

  const fetchPlaylists = async () => {
    try {
      const data = await api('/api/playlists');
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playButton.url)
    toast.success("Link copied to clipboard!")
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(playButton.id)
      toast.success("Play button removed")
    }
  }

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
        toast.error('Please select a playlist.');
        return;
    }
    try {
        await api('/api/playlists/add-button', {
            method: 'POST',
            body: JSON.stringify({
                playlist_id: selectedPlaylistId,
                play_button_id: playButton.id,
            }),
        });
        toast.success('Added to playlist!');
        setShowAddToPlaylistDialog(false);
    } catch (error) {
        toast.error('Failed to add to playlist.');
        console.error('Failed to add to playlist', error);
    }
  };

  const handleCast = async () => {
    if (!isAuthenticated || !user) {
      // should not happen if button is disabled, but good practice
      return;
    }

    try {
      const shareText = buildShareText({ title: playButton.title, artist: playButton.artist, platform: playButton.platform });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
      const frameUrl = `${appUrl}/share/${encodeURIComponent(playButton.id)}`;

      const { cast } = await sdk.actions.composeCast({ 
        text: shareText, 
        embeds: [frameUrl] 
      });

      if (cast) {
        toast.success('Cast composed successfully.');
      } else {
        toast.info('Cast composer closed.');
      }
    } catch (e) {
      console.error('Error composing cast', e);
      toast.error('Could not open composer.');
    }
  }

  const handleCopyCode = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const frameUrl = `${appUrl}/share/${encodeURIComponent(playButton.id)}`;
    navigator.clipboard.writeText(frameUrl);
    toast.success("Embed code copied to clipboard!");
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const handleReorder = (direction: 'up' | 'down') => {
    if (onReorder && playlistId) {
      onReorder(playlistId, playButton.id, direction);
    }
  };

  return (
    <>
      <Card className={`overflow-hidden hover:shadow-md transition-all duration-300 ease-in-out relative ${hasPlaylistControls ? 'pb-12' : ''}`}>
        {/* Spinner controls - bottom right corner when in playlist */}
        {hasReorderControls && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={() => handleReorder('up')}
              disabled={currentIndex === 0}
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={() => handleReorder('down')}
              disabled={currentIndex === totalItems - 1}
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Cover image - positioned top-left */}
            {playButton.coverImage ? (
              <img
                src={playButton.coverImage}
                alt={`${playButton.title} cover`}
                className="w-16 h-16 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                <Music className="w-8 h-8 text-purple-600" />
              </div>
            )}
            
            {/* Content area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate">{playButton.title}</h3>
                  {playButton.artist && <p className="text-gray-600 text-sm truncate mt-1">{playButton.artist}</p>}
                </div>

                {/* More actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(playButton.url, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Original
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowAddToPlaylistDialog(true)}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add to Playlist
                    </DropdownMenuItem>
                    {onRemove && (
                      <DropdownMenuItem onClick={handleRemove} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Play, Cast, and Copy Code buttons aligned with cover art */}
          <div className="flex justify-between mt-3">
            <Button
              onClick={() => setShowPlayer(true)}
              className="bg-[#9234EB] hover:bg-[#9234EB]/90"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>

            <Button
              variant="outline"
              className="bg-transparent"
              size="sm"
              disabled={!isAuthenticated}
              title={!isAuthenticated ? "Sign in to create casts" : "Create a cast"}
              onClick={handleCast}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Cast
            </Button>
            <Button
              variant="outline"
              className="bg-transparent"
              size="sm"
              onClick={handleCopyCode}
            >
              <Code className="w-4 h-4 mr-2" />
              Code
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Badges and metadata */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="outline" className="text-xs">
              {playButton.platform}
            </Badge>
            {playButton.coverImage && (
              <Badge variant="secondary" className="text-xs">
                <ImageIcon className="w-3 h-3 mr-1" />
                Cover
              </Badge>
            )}
            <div className="flex items-center text-xs text-gray-500 ml-auto">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(playButton.createdAt)}
            </div>
          </div>
        </CardContent>

        {/* Auto-advance controls - bottom left when enabled (defaults to true if not set) */}
        {hasAutoAdvanceControls && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/80 px-2 py-1 rounded z-10">
            <span className="text-xs text-gray-600">Auto Advance:</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={autoAdvanceSettings?.timeoutMinutes ?? 4}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 1000) {
                  onUpdateAutoAdvanceTimeout(value);
                }
              }}
              className="w-12 h-6 text-xs text-center border border-gray-300 rounded px-1"
              title="Timeout in minutes"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-gray-600">min</span>
          </div>
        )}
      </Card>

      {/* Embedded Player Modal */}
      <EmbeddedPlayerModal
        isOpen={showPlayer}
        onClose={() => {
          setShowPlayer(false);
          refreshPlayButtons();
        }}
        playButton={currentPlayButton}
        playlistContext={playlistContext ? {
          playlist: playlistContext.playlist ? {
            id: playlistContext.playlist.id,
            name: playlistContext.playlist.name,
            play_buttons: playlistContext.playlist.play_buttons || []
          } : null,
          currentIndex: playlistContext.currentIndex,
          onTrackChange: playlistContext.onTrackChange,
          autoAdvance: playlistContext.autoAdvance
        } : undefined}
      />

    <Dialog open={showAddToPlaylistDialog} onOpenChange={setShowAddToPlaylistDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add to Playlist</DialogTitle>
                <DialogDescription>
                    Select a playlist to add "{playButton.title}" to.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
                <PlaylistCombobox
                    playlists={playlists}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelect={setSelectedPlaylistId}
                />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddToPlaylistDialog(false)}>Cancel</Button>
                <Button onClick={handleAddToPlaylist}>Add</Button>
            </div>
        </DialogContent>
    </Dialog>
    </>
  )
}
