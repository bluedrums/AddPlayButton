"use client";

import React, { useMemo } from "react";
import { OnchainKitWrapper } from "@/components/onchainkit-wrapper";
import { FarcasterProvider } from "@/components/farcaster-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { base } from "viem/chains";

export function Providers({ children }: { children: React.ReactNode }) {
  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY, []);
  
  return (
    <OnchainKitWrapper
      apiKey={apiKey}
      chain={base}
      miniKit={{ enabled: true }}
    >
      <FarcasterProvider>
        {children}
        <Analytics />
        <Toaster />
      </FarcasterProvider>
    </OnchainKitWrapper>
  );
}
