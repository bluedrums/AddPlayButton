import { type NextRequest, NextResponse } from "next/server"
import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";

export async function POST(request: NextRequest) {
  const { signer, text, embeds } = await request.json();

  if (!process.env.NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY is not set")
  }

  const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

  try {
    const { hash } = await client.publishCast(signer, text, { embeds });
    return NextResponse.json({ success: true, hash });
  } catch (error) {
    console.error("Cast API error:", error)
    if (isApiErrorResponse(error)) {
      return NextResponse.json({ ...error.response.data }, { status: error.response.status })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
