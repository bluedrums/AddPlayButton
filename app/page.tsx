import ClientPage from './ClientPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
const imageUrl = `${baseUrl}/HeroImage.png`;

export const metadata: Metadata = {
  title: 'Add Play Button',
  description: 'Create shareable play buttons for Spotify, Apple Music, YouTube, and more.',
  other: {
    // --- The Correct Farcaster Frame Meta Tags for a Mini App ---

    // Specifies the Frame version. 'vNext' is the current standard.
    'fc:frame': 'vNext',

    // The image to display on the Frame preview card.
    'fc:frame:image': imageUrl,

    // The text for the first button.
    'fc:frame:button:1': 'Open App',

    // This is the critical tag. It tells the client to launch a Mini App.
    'fc:frame:button:1:action': 'miniapp',

    // The URL of the Mini App to open when the button is clicked.
    'fc:frame:button:1:target': baseUrl,

    // --- Open Graph tags for rich previews on other platforms (e.g., Twitter, Discord) ---
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
