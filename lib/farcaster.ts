// Farcaster integration utilities
export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  custodyAddress?: string
  verifications?: string[]
}

export interface CastRequest {
  text: string
  embeds?: {
    url: string
  }[]
  embedsDeprecated?: string[]
  mentions?: number[]
  mentionsPositions?: number[]
  parent?: {
    fid: number
    hash: string
  }
}

export interface CastResponse {
  success: boolean
  cast?: {
    hash: string
    author: {
      fid: number
      username: string
    }
    text: string
    timestamp: number
    warpcastUrl?: string
  }
  error?: string
}

// Format cast text for Farcaster
export function formatCastText(
  embedType: "spotify" | "apple" | "soundcloud" | "youtube",
  title?: string,
  customText?: string,
): string {
  const platformName = embedType.charAt(0).toUpperCase() + embedType.slice(1)
  const mediaType = embedType === "youtube" ? "video" : "track"

  if (customText) {
    return customText
  }

  if (title) {
    return `🎵 "${title}" - Check out this ${mediaType} on ${platformName}!`
  }

  return `🎵 Check out this ${mediaType} on ${platformName}!`
}

// Validate Farcaster cast requirements
export function validateCastData(text: string, embeds: string[]): { isValid: boolean; error?: string } {
  if (text.length > 320) {
    return { isValid: false, error: "Cast text must be 320 characters or less" }
  }

  if (embeds.length > 2) {
    return { isValid: false, error: "Maximum 2 embeds allowed per cast" }
  }

  return { isValid: true }
}
