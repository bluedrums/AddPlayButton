import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function fetchPlayButton(fid: number, id: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/playbutton?fid=${fid}&id=${encodeURIComponent(id)}`);
    if (!response.ok) {
      console.error('Failed to fetch play button:', response.status);
      return null;
    }
    const data = await response.json();
    return data.playButton || null;
  } catch (error) {
    console.error('Error fetching play button data:', error);
    throw error;
  }
} 