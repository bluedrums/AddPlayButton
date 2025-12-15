"use client";

import dynamic from "next/dynamic";

export const OnchainKitWrapper = dynamic(
  () => import("@coinbase/onchainkit").then((mod: any) => {
    console.log('OnchainKit Module:', mod);
    // Handle various ESM/CJS interop scenarios
    if (typeof mod.OnchainKitProvider === 'function') {
        return mod.OnchainKitProvider;
    }
    if (mod.default && typeof mod.default.OnchainKitProvider === 'function') {
        return mod.default.OnchainKitProvider;
    }
    // Fallback: if OnchainKitProvider is an object with a default property (rare but possible in some bundlers)
    if (mod.OnchainKitProvider && typeof mod.OnchainKitProvider.default === 'function') {
        return mod.OnchainKitProvider.default;
    }
    
    console.error("Could not resolve OnchainKitProvider", mod);
    // Return a dummy component to prevent crash if resolution fails, allowing us to see the log
    return () => <div>Error loading OnchainKit</div>;
  }),
  { ssr: false }
);

