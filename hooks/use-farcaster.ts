"use client"

import { useNeynar } from "@neynar/react"

export function useFarcaster() {
  const { user, isAuthenticated, loading, login, logout } = useNeynar()

  return {
    user,
    isAuthenticated,
    isLoading: loading,
    signIn: login,
    signOut: logout,
  }
}
