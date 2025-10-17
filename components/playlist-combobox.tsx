'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Playlist {
  id: number;
  name: string;
}

interface PlaylistComboboxProps {
  playlists: Playlist[];
  selectedPlaylistId: number | null;
  onSelect: (playlistId: number | null) => void;
  className?: string;
}

export function PlaylistCombobox({
  playlists,
  selectedPlaylistId,
  onSelect,
  className,
}: PlaylistComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedPlaylist ? selectedPlaylist.name : 'Select a playlist...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search playlists..." />
          <CommandList>
            <CommandEmpty>No playlist found.</CommandEmpty>
            <CommandGroup>
              {playlists.map((playlist) => (
                <CommandItem
                  key={playlist.id}
                  value={playlist.name}
                  onSelect={() => {
                    onSelect(playlist.id === selectedPlaylistId ? null : playlist.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedPlaylistId === playlist.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {playlist.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

