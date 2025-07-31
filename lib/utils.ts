import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Escape special characters for use in RegExp
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface ShareTextOptions {
  title: string;
  artist?: string;
  platform: string;
  includeEmoji?: boolean;
}

// Central helper to build a shareable cast text without duplicate artist/platform information.
export function buildShareText({ title, artist, platform, includeEmoji = false }: ShareTextOptions): string {
  let cleanTitle = title;

  // Remove existing "by <artist>" in title (case-insensitive)
  if (artist) {
    const byRegex = new RegExp(`\\s*by\\s+${escapeRegExp(artist)}\\b`, "i");
    cleanTitle = cleanTitle.replace(byRegex, "").trim();
  }

  // Remove existing "on <platform>" in title (case-insensitive)
  const platformRegex = new RegExp(`\\s*on\\s+${escapeRegExp(platform)}\\b`, "i");
  cleanTitle = cleanTitle.replace(platformRegex, "").trim();

  // Compose final share text
  let shareText = includeEmoji ? `▶️ ${cleanTitle}` : cleanTitle;

  if (artist) {
    shareText += ` by ${artist}`;
  }

  shareText += ` on ${platform}`;

  return shareText.trim();
}
