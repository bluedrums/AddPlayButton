"use client"

import { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import type { FarcasterUser } from '@/lib/farcaster';
import { api } from '@/lib/api';

export function useFarcaster() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);

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

  const signIn = useCallback(async () => {
    console.log("🔐 Starting sign in process...");
    setIsLoading(true);
    setError(null);
    try {
      await sdk.actions.ready();
      setIsSDKReady(true);
      
      const context = await sdk.context;
      if (context?.user) {
        const userData: FarcasterUser = {
          fid: context.user.fid,
          username: context.user.username || `user${context.user.fid}`,
          displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
          pfpUrl: context.user.pfpUrl || "/placeholder-user.jpg",
          custodyAddress: context.user.custodyAddress,
          verifications: context.user.verifications,
        };

        const sessionRes = await api('/api/auth/session', {
          method: 'POST',
          body: userData,
        });

        if (sessionRes.success) {
          setUser(sessionRes.user);
          setIsAuthenticated(true);
          return sessionRes.user;
        } else {
          throw new Error('Failed to create a session.');
        }
      } else {
        throw new Error("Please make sure you're logged into Farcaster and try again.");
      }
    } catch (err) {
      const message = `Sign in failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error("❌ Sign in error:", err);
      setError(message);
      signOut(); // Sign out if session creation fails
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Starting initialization...');
      setIsLoading(true);
      try {
        const statusRes = await api('/api/auth/status');
        console.log('📡 Session status:', statusRes);

        if (statusRes.isAuthenticated) {
          console.log('✅ User already authenticated:', statusRes.user);
          setUser(statusRes.user);
          setIsAuthenticated(true);
          setIsSDKReady(true);
        } else {
          console.log('🔄 No existing session, attempting auto-sign-in...');
          await signIn();
        }
      } catch (err) {
        console.error("❌ Initialization error:", err);
        setError(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log('🏁 Initialization complete');
        setIsLoading(false);
      }
    };
    initialize();
  }, [signIn]);

  return { user, isAuthenticated, isLoading, error, signIn, signOut, isSDKReady, setUser };
}
