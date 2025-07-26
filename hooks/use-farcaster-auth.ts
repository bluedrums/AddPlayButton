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

  // This hook is now primarily responsible for providing a consistent auth state object.
  // Sign-out logic is handled in the FarcasterProvider.

  return {
    ...authState,
    signIn: () => {}, // Placeholder for signIn
    signOut: () => {}, // Placeholder for signOut
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
