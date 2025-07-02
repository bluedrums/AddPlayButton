import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { FarcasterAuthProvider } from "@/components/farcaster-auth-provider"

export const metadata: Metadata = {
  title: "Add Play Button - Farcaster Mini App",
  description: "Add music and video play buttons to your Farcaster casts",
  generator: "v0.dev",
  manifest: "/manifest.json",
  icons: {
    icon: "/appicon.jpg",
    apple: "/appicon.jpg",
  },
  openGraph: {
    title: "Add Play Button",
    description: "Add music and video play buttons to your Farcaster casts",
    images: ["/appicon.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Add Play Button",
    description: "Add music and video play buttons to your Farcaster casts",
    images: ["/appicon.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Farcaster Auth Kit configuration pulled from environment variables
  const config = {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN,
    siweUri: process.env.NEXT_PUBLIC_APP_URL,
  }

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/appicon.jpg" />
        <link rel="apple-touch-icon" href="/appicon.jpg" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Add Play Button" />
      </head>
      <body>
        <FarcasterAuthProvider config={config}>{children}</FarcasterAuthProvider>
      </body>
    </html>
  )
}
