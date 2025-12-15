"use client";

import { useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { toast } from "sonner";
import { useClientContext, CLIENT_FIDS } from "./use-client-context";

// USDC contract on Base
const USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_ID_HEX = "0x2105";

interface UseWalletResult {
  sendUSDC: (recipientAddress: string, amountUSDC: number) => Promise<boolean>;
  isProcessing: boolean;
  clientType: string;
  isBase: boolean;
  isWarpcast: boolean;
}

/**
 * A unified wallet hook that automatically uses the correct wallet
 * based on the client app context (Base app, Warpcast, etc.)
 * 
 * The SDK's wallet provider handles the underlying wallet implementation,
 * so this works generically across all Farcaster-compatible clients.
 */
export function useWallet(): UseWalletResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const { clientType, isBase, isWarpcast } = useClientContext();

  const sendUSDC = useCallback(
    async (recipientAddress: string, amountUSDC: number): Promise<boolean> => {
      setIsProcessing(true);

      try {
        // Get the wallet provider from the SDK
        // This automatically returns the correct wallet for the current client
        const provider = await sdk.wallet.getEthereumProvider();

        if (!provider) {
          throw new Error("Wallet provider not available. Please ensure you're in a supported app.");
        }

        // Request accounts (will prompt user if needed)
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        if (!accounts || !accounts[0]) {
          throw new Error("Could not connect to wallet. Please try again.");
        }

        const fromAddress = accounts[0];

        // Ensure we're on Base network
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_ID_HEX }],
          });
        } catch (switchError: any) {
          // If chain doesn't exist, try to add it
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: BASE_CHAIN_ID_HEX,
                    chainName: "Base",
                    nativeCurrency: {
                      name: "Ethereum",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://mainnet.base.org"],
                    blockExplorerUrls: ["https://basescan.org"],
                  },
                ],
              });
            } catch (addError) {
              throw new Error("Please add the Base network to your wallet and try again.");
            }
          } else {
            // Don't fail on switch errors - the transaction might still work
            console.warn("Chain switch warning:", switchError);
          }
        }

        // Prepare USDC transfer
        // USDC has 6 decimals
        const amount = Math.floor(amountUSDC * 1_000_000);
        const paddedAddress = recipientAddress.slice(2).padStart(64, "0");
        const paddedAmount = amount.toString(16).padStart(64, "0");
        // ERC20 transfer function selector: 0xa9059cbb
        const txData = `0xa9059cbb${paddedAddress}${paddedAmount}`;

        const txParams = {
          from: fromAddress as `0x${string}`,
          to: USDC_CONTRACT_ADDRESS as `0x${string}`,
          value: "0x0" as `0x${string}`,
          data: txData as `0x${string}`,
        };

        // Send the transaction
        await provider.request({
          method: "eth_sendTransaction",
          params: [txParams],
        });

        // Show success with client-specific messaging
        const clientName = isBase ? "Base" : isWarpcast ? "Warpcast" : "your";
        toast.success(`Payment sent via ${clientName} wallet! 💜`);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process payment.";
        console.error("Wallet payment error:", error);
        toast.error(message);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [isBase, isWarpcast]
  );

  return {
    sendUSDC,
    isProcessing,
    clientType,
    isBase,
    isWarpcast,
  };
}
