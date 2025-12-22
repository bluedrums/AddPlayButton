import ClientPage from './ClientPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MainLayout } from '@/components/main-layout';

export const dynamic = 'force-dynamic';        // ensure SSR on every request
export const revalidate = 0;                   // disable static cache

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
const imageUrl = `${baseUrl}/ThePlayButton.png`;   // 3:2   ✅
const splashImageUrl = `${baseUrl}/appicon(whiteontransparent).png`;

export async function generateMetadata(): Promise<Metadata> {
  const embed = {
    version: '1',
    imageUrl,
    button: {
      title: 'Add Play Button',
      action: {
        type: 'launch_frame',
        name: 'Add Play Button',
        url: `${baseUrl}?home`,               // any URL ≠ current page
        splashImageUrl: splashImageUrl,
        splashBackgroundColor: '#8A63D3',
      },
    },
  };

  return {
    title: 'Add Play Button',
    description:
      'Create shareable play buttons for Spotify, Apple Music, YouTube, and more.',
    other: {
      'fc:miniapp': JSON.stringify(embed),
      'fc:frame':   JSON.stringify(embed),
      // optional OG tags
      'og:title':       'Add Play Button',
      'og:description': 'Create shareable play buttons for music and video links.',
      'og:image':       imageUrl,
    },
  };
}

export default function Home() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading…</div>}>
        <ClientPage />
      </Suspense>
    </MainLayout>
  );
}
