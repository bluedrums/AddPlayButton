'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Music } from 'lucide-react';
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

interface PlayButtonComboboxProps {
  playButtons: PlayButton[];
  selectedPlayButtonId: string | null;
  onSelect: (playButtonId: string | null) => void;
  className?: string;
}

export function PlayButtonCombobox({
  playButtons,
  selectedPlayButtonId,
  onSelect,
  className,
}: PlayButtonComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedPlayButton = playButtons.find(pb => pb.id === selectedPlayButtonId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedPlayButton ? selectedPlayButton.title : 'Select a play button...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search play buttons..." />
          <CommandList>
            <CommandEmpty>No play button found.</CommandEmpty>
            <CommandGroup>
              {playButtons.map((playButton) => (
                <CommandItem
                  key={playButton.id}
                  value={playButton.title}
                  onSelect={() => {
                    onSelect(playButton.id === selectedPlayButtonId ? null : playButton.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedPlayButtonId === playButton.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* 25x25px cover image */}
                    {playButton.coverImage ? (
                      <img
                        src={playButton.coverImage}
                        alt={`${playButton.title} cover`}
                        className="w-6 h-6 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                        <Music className="w-3 h-3 text-purple-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{playButton.title}</div>
                      {playButton.artist && (
                        <div className="truncate text-sm text-gray-500">{playButton.artist}</div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
