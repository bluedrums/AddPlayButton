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
      url: baseUrl,
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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  );
}
