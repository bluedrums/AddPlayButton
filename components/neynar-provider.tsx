"use client"

import { NeynarProvider, NeynarUser } from "@neynar/react"
import { api } from "@/lib/api"

export function NextNeynarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const handleLogin = async (user: NeynarUser) => {
    try {
      await api("/api/auth/farcaster", {
        method: "POST",
        body: user,
      })
    } catch (err) {
      console.error("Login failed:", err)
    }
  }

  return (
    <NeynarProvider
      onLogin={handleLogin}
    >
      {children}
    </NeynarProvider>
  )
}