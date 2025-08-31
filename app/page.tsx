import ClientPage from './ClientPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
const imageUrl = `${baseUrl}/HeroImage.png`; // Using the more descriptive hero image

export const metadata: Metadata = {
  title: 'Add Play Button',
  description: 'Create shareable play buttons for Spotify, Apple Music, YouTube, and more.',
  other: {
    // Farcaster Frame metadata
    'fc:frame': 'vNext',
    'fc:frame:image': imageUrl,
    'fc:frame:button:1': 'Open App',
    'fc:frame:button:1:action': 'miniapp',
    'fc:frame:button:1:target': baseUrl,

    // Open Graph metadata for rich previews on other platforms
    'og:title': 'Add Play Button',
    'og:description': 'Create shareable play buttons for music and video links.',
    'og:image': imageUrl,
  },
};

export default function Home({ searchParams }: { searchParams?: { debug?: string } }) {
  const showDebug = searchParams?.debug === 'env';

  return (
    <div>
      {showDebug && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'black',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <strong>Environment Debug:</strong><br/>
          NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'}<br/>
          NEXT_PUBLIC_USDC_ADDRESS: {process.env.NEXT_PUBLIC_USDC_ADDRESS ? 'SET' : 'NOT_SET'}<br/>
          NEXT_PUBLIC_BASE_PROJECT_ID: {process.env.NEXT_PUBLIC_BASE_PROJECT_ID ? 'SET' : 'NOT_SET'}<br/>
          NODE_ENV: {process.env.NODE_ENV || 'NOT_SET'}
        </div>
      )}
      <Suspense fallback={<div>Loading...</div>}>
        <ClientPage />
      </Suspense>
    </div>
  );
}
