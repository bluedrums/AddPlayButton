import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function fetchPlayButton(fid: number, id: string): Promise<any | null> {
  const client = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));

  let cursor: string | undefined = undefined;
  let playButtonData = null;

  do {
    const data = await client.fetchCastsForUser({ fid, limit: 150, cursor });
    for (const cast of data.casts) {
      try {
        const parsed = JSON.parse(cast.text);
        if (parsed.id === id) {
          playButtonData = parsed;
          break;
        }
      } catch {}
    }
    cursor = data.next?.cursor ?? undefined;
    if (playButtonData) break;
  } while (cursor);

  return playButtonData;
} 