/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'encrypted-media=(), fullscreen=(), autoplay=()',
          },
          // Allow embedding in Warpcast mini-app iframe
          // commenting out for now because of Vercel injecting duplicate security headers
/*           {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          }, */
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz",
        },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default {
  ...nextConfig,
  experimental: {
    allowIframeEmbedding: true,   // <-- turns off SAMEORIGIN
  },
  // …
}