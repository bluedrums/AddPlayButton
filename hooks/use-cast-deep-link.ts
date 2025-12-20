"use client";

import { useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
  play_buttons?: PlayButton[];
}

interface DeepLinkCallbacks {
  onPlayButtonFound: (playButton: PlayButton) => void;
  onPlaylistFound: (playlist: Playlist, startIndex: number) => void;
}

/**
 * Hook to monitor SDK context changes and handle cast deep links
 * This allows the embedded player to open when clicking play buttons in casts
 * even when the miniapp is already open
 */
export function useCastDeepLink(callbacks: DeepLinkCallbacks) {
  const lastContextRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const checkContext = async () => {
      // Prevent concurrent processing
      if (isProcessingRef.current || !isMounted) return;

      try {
        const context = await sdk.context;
        
        // Create a unique identifier for this context state
        const contextKey = JSON.stringify({
          locationType: context.location?.type,
          embed: context.location?.type === 'cast_embed' ? context.location.embed : null,
          castHash: context.location?.type === 'cast_share' ? context.location.cast?.hash : null,
        });

        // Only process if context has changed
        if (contextKey === lastContextRef.current) {
          return;
        }

        lastContextRef.current = contextKey;
        isProcessingRef.current = true;

        let frameUrl: string | undefined;

        if (context.location?.type === 'cast_embed') {
          frameUrl = context.location.embed;
        } else if (context.location?.type === 'cast_share' && context.location.cast?.embeds) {
          for (const embed of context.location.cast.embeds) {
            if (typeof embed === 'string' && embed.startsWith('http')) {
              frameUrl = embed;
              break;
            }
            if (typeof embed === 'object' && embed !== null && 'url' in embed && typeof (embed as any).url === 'string') {
              frameUrl = (embed as any).url;
              break;
            }
          }
        }

        if (frameUrl) {
          console.log('Found frameUrl for deep linking:', frameUrl);
          const url = new URL(frameUrl);
          const pathSegments = url.pathname.split('/').filter(Boolean);
          const playlistIdStr = url.searchParams.get('playlistId');
          const startIndexStr = url.searchParams.get('startIndex');

          // Handle playlist share with context
          if (playlistIdStr) {
            const playlistId = Number(playlistIdStr);
            const startIndex = Number(startIndexStr) || 0;

            if (!isNaN(playlistId)) {
              console.log(`Playlist share deep link: playlistId=${playlistId}, startIndex=${startIndex}`);
              try {
                const playlistData = await api(`/api/playlists/${playlistId}`);
                if (playlistData.error) {
                  toast.error('This playlist was not found. It may have been deleted.');
                } else if (playlistData.play_buttons && playlistData.play_buttons.length > 0) {
                  const validStartIndex = Math.min(
                    Math.max(0, startIndex),
                    playlistData.play_buttons.length - 1
                  );
                  callbacksRef.current.onPlaylistFound(playlistData, validStartIndex);
                } else {
                  toast.error('This playlist is empty.');
                }
              } catch (error) {
                console.error('Failed to fetch playlist for playback:', error);
                toast.error('Failed to load playlist');
              }
            }
          }
          // Handle individual play button share (no playlist context)
          else if (pathSegments[0] === 'share' && pathSegments[1]) {
            const playButtonId = decodeURIComponent(pathSegments[1]);
            const fid = context.user?.fid;

            if (playButtonId && fid) {
              console.log(`Deep link details: playButtonId=${playButtonId}, fid=${fid}`);

              // Pass FID in headers, not as query parameter
              const data = await api(`/api/playbutton?id=${playButtonId}`, {
                headers: { 'x-user-fid': String(fid) }
              });

              if (data.error) {
                if (data.error === 'Play button not found') {
                  toast.error('This play button was not found. It may have been deleted.');
                } else {
                  toast.error(data.error);
                }
              } else {
                const pb = { ...data, createdAt: new Date(data.createdAt) };
                callbacksRef.current.onPlayButtonFound(pb);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to check SDK context:', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Initial check
    checkContext();

    // Poll for context changes every 500ms
    // This allows us to detect when user clicks a play button in a cast
    intervalId = setInterval(checkContext, 500);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Empty deps - callbacks are accessed via ref
}

