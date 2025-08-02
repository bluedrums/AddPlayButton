"use client"

import { useState, useEffect, useCallback } from 'react';
import type { FarcasterUser } from '@/lib/farcaster';
import { api } from '@/lib/api';
import { useSignIn } from '@farcaster/auth-kit';
import { sdk } from '@farcaster/miniapp-sdk';

export function useFarcaster() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [nonce, setNonce] = useState<string | undefined>(undefined);

  // Fetch nonce on mount
  useEffect(() => {
    const fetchNonce = async () => {
      try {
        const res = await api('/api/auth/siwe');
        setNonce(res.nonce);
      } catch (err) {
        console.error('Failed to fetch nonce:', err);
      }
    };
    fetchNonce();
  }, []);

  // Update useSignIn to use nonce
  const { signIn: connect, isPolling, isError, error: authError } = useSignIn({
    nonce: nonce || undefined,
    onSuccess: async (data) => {
      try {
        const res = await api('/api/auth/farcaster', {
          method: 'POST',
          body: JSON.stringify({
            action: 'verify',
            message: data.message,
            signature: data.signature,
            nonce: data.nonce,
            domain: window.location.hostname,
            fid: data.fid,
          }),
        });
        if (res.success) {
          setUser(res.user);
          setIsAuthenticated(true);
        } else {
          throw new Error(res.error || 'Failed to verify signature.');
        }
      } catch (err) {
        const message = `Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
        console.error("❌ Verification error:", err);
        setError(message);
      }
    },
  });

  const signOut = useCallback(async () => {
    try {
      await api('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const statusRes = await api('/api/auth/status');
        if (statusRes.isAuthenticated) {
          setUser(statusRes.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Not logged in is the default state
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    sdk.actions.ready().then(() => setIsSDKReady(true)).catch(console.error);
  }, []);


  
  return { 
    user, 
    isAuthenticated, 
    isLoading: isLoading || isPolling, 
    error: error || (isError ? authError?.message : null),
    signIn: connect, 
    signOut, 
    isSDKReady,
    setUser
  };
}
