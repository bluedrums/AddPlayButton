import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function fetchPlayButton(fid: number, id: string): Promise<any | null> {
  const client = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));

  let cursor: string | undefined = undefined;
  let playButtonData = null;
  let isDeleted = false;

  do {
    const data = await client.fetchCastsForUser({ fid, limit: 150, cursor });
    for (const cast of data.casts) {
      try {
        const parsed = JSON.parse(cast.text);
        if (parsed.id === id) {
          playButtonData = parsed;
        } else if (parsed.deleted === id) {
          isDeleted = true;
          break;
        }
      } catch {}
    }
    if (isDeleted) break;
    cursor = data.next?.cursor ?? undefined;
    if (playButtonData && !isDeleted) break;
  } while (cursor);

  return isDeleted ? null : playButtonData;
} 