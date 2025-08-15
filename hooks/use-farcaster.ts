"use client"

import { useState, useEffect, useCallback } from 'react';
import type { FarcasterUser } from '@/lib/farcaster';
import { api, clearCsrfToken } from '@/lib/api';
import { sdk } from '@farcaster/miniapp-sdk';

export function useFarcaster() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);

  const signIn = useCallback(async () => {
    console.log('signIn called, isSDKReady:', isSDKReady);
    
    if (!isSDKReady) {
      console.error('Cannot sign in: SDK not ready');
      setError('Authentication service not ready. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // For mini-apps, we need to use the SDK's authentication flow
      console.log('Getting user context from SDK...');
      const context = await sdk.context;
      console.log('SDK context:', context);
      
      if (!context?.user) {
        throw new Error('No user context available from Farcaster');
      }

      // Verify with our backend
      const res = await api('/api/auth/farcaster', {
        method: 'POST',
        body: JSON.stringify({
          action: 'miniapp-auth',
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
          // Include any other context data that might be useful
          context: context
        }),
      });
      
      if (res.success) {
        console.log('✅ Authentication successful, user:', res.user);
        setUser(res.user);
        setIsAuthenticated(true);
        setError(null);
        
        // Store auth state in sessionStorage as backup for iframe context
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('farcaster_user', JSON.stringify(res.user));
          sessionStorage.setItem('farcaster_authenticated', 'true');
        }
      } else {
        throw new Error(res.error || 'Failed to authenticate.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      console.error("❌ Authentication error:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSDKReady]);

  const signOut = useCallback(async () => {
    try {
      await api('/api/auth/signout', { method: 'POST' });
      clearCsrfToken(); // Clear CSRF token cache after signout
      
      // Clear sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('farcaster_user');
        sessionStorage.removeItem('farcaster_authenticated');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const initialize = () => {
      // Try to restore auth state from sessionStorage first
      if (typeof window !== 'undefined') {
        const storedUser = sessionStorage.getItem('farcaster_user');
        const storedAuth = sessionStorage.getItem('farcaster_authenticated');
        
        if (storedUser && storedAuth === 'true') {
          try {
            const user = JSON.parse(storedUser);
            console.log('🔄 Restored auth state from sessionStorage:', user.fid);
            setUser(user);
            setIsAuthenticated(true);
            setIsLoading(false); // Stop loading since we restored the session
          } catch (err) {
            console.error('Failed to parse stored user:', err);
          }
        }
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    sdk.actions.ready()
      .then(() => {
        console.log('SDK is ready');
        setIsSDKReady(true);
      })
      .catch((err) => {
        console.error('SDK ready error:', err);
        setError('Failed to initialize Farcaster SDK');
        setIsLoading(false);
      });
  }, []);

  // Auto sign-in when SDK is ready and user is not authenticated
  useEffect(() => {
    if (isSDKReady && !isAuthenticated && !error && !user) {
      console.log('Auto-signing in...');
      // Add a small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        signIn();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSDKReady, isAuthenticated, error, user, signIn]);

  return { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    signIn, 
    signOut, 
    isSDKReady,
    setUser
  };
}
