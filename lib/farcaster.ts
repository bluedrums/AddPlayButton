// Farcaster integration utilities
export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  custodyAddress?: string
  verifications?: string[]
}
