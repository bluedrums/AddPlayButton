import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FarcasterProvider } from "@/components/farcaster-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Add Play Button - Farcaster Mini App",
  description: "Transform your music and video links into interactive play buttons for Farcaster",
  keywords: ["farcaster", "music", "video", "spotify", "youtube", "apple music", "soundcloud"],
  authors: [{ name: "Add Play Button Team" }],
  creator: "Add Play Button Team",
  publisher: "Add Play Button",
  robots: "index, follow",
  openGraph: {
    title: "Add Play Button - Farcaster Mini App",
    description: "Transform your music and video links into interactive play buttons for Farcaster",
    url: "https://addplaybutton.xyz",
    siteName: "Add Play Button",
    images: [
      {
        url: "https://addplaybutton.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "Add Play Button - Farcaster Mini App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Add Play Button - Farcaster Mini App",
    description: "Transform your music and video links into interactive play buttons for Farcaster",
    images: ["https://addplaybutton.xyz/og-image.png"],
    creator: "@addplaybutton",
  },
  icons: {
    icon: [
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#8B5CF6" }],
  },
  manifest: "/manifest.json",
  other: {
    "fc:frame": "vNext",
    "fc:frame:name": "Add Play Button",
    "fc:frame:icon": "https://addplaybutton.xyz/icon-192x192.png",
    "fc:frame:image": "https://addplaybutton.xyz/og-image.png",
    "fc:frame:button:1": "🎵 Add Play Button",
    "fc:frame:button:1:action": "launch",
    "fc:frame:button:1:target": "https://addplaybutton.xyz",
    "fc:frame:splash:image": "https://addplaybutton.xyz/splash.png",
    "fc:frame:splash:color": "#8B5CF6",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FarcasterProvider>
          {children}
          <Toaster />
        </FarcasterProvider>
      </body>
    </html>
  )
}
