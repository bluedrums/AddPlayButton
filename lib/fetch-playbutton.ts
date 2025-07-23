import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function fetchPlayButton(fid: number, id: string): Promise<any | null> {
  try {
    const client = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));

    let cursor: string | undefined = undefined;
    let playButtonData = null;
    let isDeleted = false;

    do {
      try {
        const data = await client.fetchCastsForUser({ fid, limit: 150, cursor });
        
        // Check if data is valid
        if (!data || !data.casts) {
          console.error('Invalid response from Neynar API:', data);
          break;
        }
        
        for (const cast of data.casts) {
          try {
            const parsed = JSON.parse(cast.text);
            if (parsed.id === id) {
              playButtonData = parsed;
            } else if (parsed.deleted === id) {
              isDeleted = true;
              break;
            }
          } catch (parseError) {
            // Skip casts that don't contain valid JSON
            continue;
          }
        }
        if (isDeleted) break;
        cursor = data.next?.cursor ?? undefined;
        if (playButtonData && !isDeleted) break;
      } catch (apiError) {
        console.error('Error fetching casts from Neynar API:', apiError);
        break;
      }
    } while (cursor);

    return isDeleted ? null : playButtonData;
  } catch (error) {
    console.error('Error fetching play button data:', error);
    throw error;
  }
} 