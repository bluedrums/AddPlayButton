import type React from "react"
import type { Metadata, Viewport } from "next"
import { Ubuntu } from 'next/font/google';
import "./globals.css"
import { FarcasterProvider } from "@/components/farcaster-provider"
import { Toaster } from "@/components/ui/sonner"

const ubuntu = Ubuntu({ subsets: ["latin"], weight: ['300', '400', '500', '700'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Add Play Button",
  description: "Create interactive Farcaster casts for music and video links",
  openGraph: {
    title: "Add Play Button",
    description: "Create interactive Farcaster casts for music and video links",
    images: [`/ThePlayButton.png`],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `/ThePlayButton.png`,
    "fc:frame:image:aspect_ratio": "1.91:1",
    "fc:frame:button:1": "Create a Play Button",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": `${process.env.NEXT_PUBLIC_APP_URL}`,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={ubuntu.className}>
        <FarcasterProvider>
          {children}
          <Toaster />
        </FarcasterProvider>
      </body>
    </html>
  )
}
