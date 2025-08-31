import ClientPage from './ClientPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
const fallbackEmbed = {
  version: '1',
  imageUrl: `${baseUrl}/ThePlayButton.png`,
  button: {
    title: 'Open',
    action: {
      type: 'launch_frame',
      name: 'Add Play Button',
      url: `${baseUrl}`,
    },
  },
};

export const metadata: Metadata = {
  title: 'Add Play Button',
  description: 'Create shareable play buttons for Spotify, Apple Music, YouTube, and more.',
  other: {
    'fc:miniapp': JSON.stringify(fallbackEmbed),
    'fc:frame': JSON.stringify(fallbackEmbed),
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
