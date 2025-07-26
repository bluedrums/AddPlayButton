"use client"

import { useState, useEffect, useCallback } from "react"
import type { FarcasterUser } from "@/lib/farcaster"

interface AuthState {
  user: FarcasterUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useFarcasterAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  // This hook is now primarily responsible for handling the sign-out logic
  // and providing a consistent auth state object to the rest of the application.

  const signOut = useCallback(() => {
    // For now, we'll just clear the session cookie.
    // A full implementation would also call an API endpoint to invalidate the session on the server.
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, [])

  return {
    ...authState,
    signIn: () => {}, // Placeholder for signIn
    signOut,
    setUser: (user: FarcasterUser) => {
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    },
  }
}
