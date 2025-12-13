"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Known client FIDs
export const CLIENT_FIDS = {
  BASE: 309857,
  WARPCAST: 9152,
} as const;

export type ClientType = "base" | "warpcast" | "unknown";

interface ClientContext {
  clientFid: number | null;
  clientType: ClientType;
  isBase: boolean;
  isWarpcast: boolean;
  isLoading: boolean;
}

export function useClientContext(): ClientContext {
  const [clientFid, setClientFid] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectClient = async () => {
      try {
        const context = await sdk.context;
        if (context?.client?.clientFid) {
          setClientFid(context.client.clientFid);
        }
      } catch (error) {
        console.error("Failed to detect client context:", error);
      } finally {
        setIsLoading(false);
      }
    };

    detectClient();
  }, []);

  const clientType: ClientType =
    clientFid === CLIENT_FIDS.BASE
      ? "base"
      : clientFid === CLIENT_FIDS.WARPCAST
      ? "warpcast"
      : "unknown";

  return {
    clientFid,
    clientType,
    isBase: clientFid === CLIENT_FIDS.BASE,
    isWarpcast: clientFid === CLIENT_FIDS.WARPCAST,
    isLoading,
  };
}
