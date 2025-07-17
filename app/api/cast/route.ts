import { type NextRequest, NextResponse } from "next/server"
import { formatCastText, validateCastData } from "@/lib/farcaster"
import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { fid, text, embedUrl, embedType, title, signerUuid } = await request.json()

    if (!fid || !embedUrl || !embedType || !signerUuid) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Format the cast text
    const castText = text || formatCastText(embedType, title)
    const embeds = [embedUrl]

    // Validate cast data
    const validation = validateCastData(castText, embeds)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Submit cast to Farcaster Hub
    const castData = {
      text: castText,
      embeds: embeds.map((url) => ({ url })),
      embedsDeprecated: embeds,
    }

    // Submit cast using Neynar
    try {
      const { hash } = await client.publishCast(signerUuid, castData.text, {
        embeds: castData.embeds
      });

      // Fetch cast details to get author info (optional, since Neynar might not return full details)
      const castDetails = await client.lookUpCastByHash(hash);

      return NextResponse.json({
        success: true,
        cast: {
          hash,
          author: {
            fid: castDetails.cast.author.fid,
            username: castDetails.cast.author.username,
          },
          text: castDetails.cast.text,
          timestamp: castDetails.cast.timestamp,
          warpcastUrl: `https://warpcast.com/${castDetails.cast.author.username}/${hash.slice(0, 10)}`,
        },
      });
    } catch (err) {
      if (isApiErrorResponse(err)) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }

  } catch (error: any) {
    console.error("Cast creation error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to create cast" }, { status: 500 })
  }
}
