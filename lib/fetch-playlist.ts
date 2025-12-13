import "server-only";

interface PlayButton {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist?: string;
  embedUrl: string;
  coverImage?: string;
  createdAt: string;
  autoAdvanceTimeout?: number;
}

export interface Playlist {
  id: number;
  name: string;
  user_fid: number;
  created_at: string;
  play_buttons: PlayButton[];
}

export const fetchPlaylist = async (playlistId: number): Promise<Playlist | null> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const apiUrl = `${baseUrl}/api/playlists/${playlistId}`;
    
    console.log(`fetchPlaylist: fetching ${apiUrl}`);

    const response = await fetch(apiUrl, {
      cache: 'no-store', // Disable caching for fresh data
    });
    
    console.log(`fetchPlaylist: response status ${response.status}`);
    
    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`Failed to fetch playlist. Status: ${response.status}, Body: ${bodyText}`);
      return null;
    }
    
    const data = await response.json();
    
    console.log(`fetchPlaylist: received data`, {
      id: data.id,
      name: data.name,
      trackCount: data.play_buttons?.length,
      firstTrackCover: data.play_buttons?.[0]?.coverImage,
    });
    
    if (data.error) {
      console.error(`API Error fetching playlist: ${data.error}`);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchPlaylist:', error);
    return null;
  }
};
