"use client";

import React from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { FarcasterProvider } from "@/components/farcaster-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { base } from "viem/chains";
import { MainNav } from '@/components/main-nav';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      miniKit={{ enabled: true }}
    >
      <FarcasterProvider>
        {children}
        <MainNav />
        <Analytics />
        <Toaster />
      </FarcasterProvider>
    </OnchainKitProvider>
  );
}
