"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { sdk, FarcasterSDK } from '@farcaster/miniapp-sdk';

interface FarcasterSDKContextType {
  sdk: FarcasterSDK | null;
  isReady: boolean;
}

const FarcasterSDKContext = createContext<FarcasterSDKContextType>({
  sdk: null,
  isReady: false,
});

export const useFarcasterSDK = () => useContext(FarcasterSDKContext);

export function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await sdk.actions.ready();
      setIsReady(true);
    };
    init();
  }, []);

  return (
    <FarcasterSDKContext.Provider value={{ sdk, isReady }}>
      {children}
    </FarcasterSDKContext.Provider>
  );
}
