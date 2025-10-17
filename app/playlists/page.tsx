'use client';

import { useState, useEffect } from 'react';
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
import { ListMusic, PlusCircle, Trash2, Loader2, Share2, Plus, User, LogOut, Upload } from 'lucide-react';
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
import PlaylistIcon from '@/components/icons/Icon/Filled/Playlist.svg';

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

export default function PlaylistsPage() {
  const { isAuthenticated, user, signOut } = useFarcaster();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayButtons, setAllPlayButtons] = useState<PlayButton[]>([]);
  const [showAddButtonDialog, setShowAddButtonDialog] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [selectedPlayButtonId, setSelectedPlayButtonId] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPlaylists();
      fetchAllPlayButtons();
    } else {
        setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await api('/api/playlists');
      setPlaylists(data.map((p: any) => ({
        ...p,
        play_buttons: (p.play_buttons || []).map((pb: any) => ({ ...pb, createdAt: new Date(pb.createdAt)}))
      })));
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

  const handleSharePlaylist = async (playlist: Playlist) => {
    if (!playlist.play_buttons || playlist.play_buttons.length === 0) {
      toast.error('Cannot share an empty playlist.');
      return;
    }

    const firstButton = playlist.play_buttons[0];
    const coverImage = firstButton.coverImage;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';

    // Create playlist URL
    const playlistUrl = `${baseUrl}/playlists`;

    // Create cast text
    const castText = `🎵 Check out my playlist "${playlist.name}" with ${playlist.play_buttons.length} track${playlist.play_buttons.length > 1 ? 's' : ''}!\n\n${playlistUrl}`;

    try {
      // Use Farcaster SDK to create cast with embed
      const { cast } = await sdk.actions.composeCast({
        text: castText,
        embeds: coverImage ? [playlistUrl, coverImage] : [playlistUrl]
      });

      toast.success('Playlist shared successfully!');
    } catch (error) {
      console.error('Failed to share playlist:', error);
      toast.error('Failed to share playlist. Please try again.');
    }
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#8A63D2] flex items-center justify-center">
                    <PlaylistIcon className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-[-1px]">Playlists</h1>
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
            <Button onClick={handleCreatePlaylist}>Create</Button>
          </CardContent>
        </Card>

        {isLoading ? (
            <div className="flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        ) : playlists.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {playlists.map((playlist) => (
              <AccordionItem value={`item-${playlist.id}`} key={playlist.id}>
                <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                        <span>{playlist.name} ({playlist.play_buttons?.length || 0})</span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSharePlaylist(playlist);
                                }}
                                className="text-blue-500 hover:text-blue-700"
                            >
                                <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPlaylist(playlist);
                                    setShowAddButtonDialog(true);
                                }}
                                className="text-green-500 hover:text-green-700"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the playlist "{playlist.name}". This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePlaylist(playlist.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {playlist.play_buttons?.map((pb) => (
                      <PlayButtonCard
                          key={pb.id}
                          playButton={pb}
                          onRemove={(id) => handleRemoveFromPlaylist(playlist.id, id)}
                      />
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
    </MainLayout>
  );
}

