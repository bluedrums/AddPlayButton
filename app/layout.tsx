import React from "react"
import type { Metadata, Viewport } from "next"
import { Ubuntu } from 'next/font/google';
import "./globals.css"
import { Providers } from "@/components/providers";
import { MainNav } from '@/components/main-nav';

const ubuntu = Ubuntu({ subsets: ["latin"], weight: ['300', '400', '500', '700'] });

// Add default Mini-App embed for global pages
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
const imageUrl = `${baseUrl}/ThePlayButton.png`;
const embed = {
  version: '1',
  imageUrl,
  button: {
    title: 'Add Play Button',
    action: {
      type: 'launch_frame',
      name: 'Add Play Button',
      url: `${baseUrl}?home`,               // any URL ≠ current page
      splashImageUrl: imageUrl,
      splashBackgroundColor: '#8B5CF6',
    },
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Add Play Button",
  description: "Create interactive casts for music and video links",
  openGraph: {
    title: "Add Play Button",
    description: "Create interactive casts for music and video links",
    images: [`/ThePlayButton.png`],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${ubuntu.className} h-full`}>
        <div id="app-container" className="h-full">
            <Providers>
              {children}
              <MainNav />
            </Providers>
        </div>
        {/* Base Pay SDK */}
        <script
          src="https://pay.coinbase.com/js/base.js"
          async
        />
      </body>
    </html>
  )
}
