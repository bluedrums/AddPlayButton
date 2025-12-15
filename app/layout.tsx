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
        {/* Immediate splash screen - shows before React hydrates */}
        <div 
          id="initial-splash"
          style={{
            backgroundColor: '#8A63D3',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 99999,
            margin: 0,
            padding: 0,
            fontFamily: "'Ubuntu', sans-serif",
          }}
        >
          <img 
            src="/appicon.jpg" 
            alt="App Icon" 
            style={{
              width: '128px',
              height: '128px',
              borderRadius: '24px',
              marginBottom: '24px'
            }}
          />
          <h1 
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              margin: '0 0 8px 0',
              textAlign: 'center',
            }}
          >
            Add Play Button
          </h1>
          <p 
            style={{
              fontSize: '16px',
              fontWeight: '400',
              color: 'white',
              margin: 0,
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            Share and drive traffic anywhere.
          </p>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; }
            #initial-splash { display: flex !important; }
          `
        }} />
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
