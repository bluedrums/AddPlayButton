import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ success: false, error: "FID is required" }, { status: 400 })
    }

    // Fetch user's recent casts from Farcaster
    const response = await fetch(`https://api.warpcast.com/v2/casts?fid=${fid}&limit=25`, {
      headers: {
        Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch casts")
    }

    const data = await response.json()

    // Filter casts that contain music/video embeds
    const musicCasts = data.result.casts.filter((cast: any) => {
      return cast.embeds?.some((embed: any) => {
        const url = embed.url?.toLowerCase() || ""
        return (
          url.includes("spotify.com") ||
          url.includes("music.apple.com") ||
          url.includes("soundcloud.com") ||
          url.includes("youtube.com") ||
          url.includes("youtu.be")
        )
      })
    })

    const formattedCasts = musicCasts.map((cast: any) => {
      const musicEmbed = cast.embeds?.find((embed: any) => {
        const url = embed.url?.toLowerCase() || ""
        return (
          url.includes("spotify.com") ||
          url.includes("music.apple.com") ||
          url.includes("soundcloud.com") ||
          url.includes("youtube.com") ||
          url.includes("youtu.be")
        )
      })

      let embedType = "unknown"
      if (musicEmbed?.url) {
        const url = musicEmbed.url.toLowerCase()
        if (url.includes("spotify.com")) embedType = "spotify"
        else if (url.includes("music.apple.com")) embedType = "apple"
        else if (url.includes("soundcloud.com")) embedType = "soundcloud"
        else if (url.includes("youtube.com") || url.includes("youtu.be")) embedType = "youtube"
      }

      return {
        id: cast.hash,
        hash: cast.hash,
        text: cast.text,
        timestamp: new Date(cast.timestamp).getTime(),
        embedUrl: musicEmbed?.url || "",
        embedType,
        warpcastUrl: `https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`,
        author: {
          fid: cast.author.fid,
          username: cast.author.username,
          displayName: cast.author.displayName,
          pfpUrl: cast.author.pfp?.url,
        },
      }
    })

    return NextResponse.json({
      success: true,
      casts: formattedCasts,
    })
  } catch (error: any) {
    console.error("Error fetching user casts:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch casts" }, { status: 500 })
  }
}
