import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration, isApiErrorResponse } from "@neynar/nodejs-sdk";

const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY! });
const client = new NeynarAPIClient(config);

export async function POST() {
  try {
    const signer = await client.createSigner();
    return NextResponse.json({
      success: true,
      signer_uuid: signer.signer_uuid,
      approval_url: signer.signer_approval_url,
      status: signer.status
    });
  } catch (error) {
    console.error("Error creating signer:", error);
    return NextResponse.json({ success: false, error: "Failed to create signer" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const signerUuid = request.nextUrl.searchParams.get("signer_uuid");

  if (!signerUuid) {
    return NextResponse.json({ success: false, error: "signer_uuid is required" }, { status: 400 });
  }

  try {
    const status = await client.lookupSigner({ signerUuid });
    return NextResponse.json({
      success: true,
      status: status.status,
      fid: status.fid
    });
  } catch (error) {
    if (isApiErrorResponse(error)) {
      return NextResponse.json({ success: false, error: error.response.data.message }, { status: error.response.status });
    }
    console.error("Error checking signer status:", error);
    return NextResponse.json({ success: false, error: "Failed to check signer status" }, { status: 500 });
  }
} 