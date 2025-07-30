/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Turns off Vercel’s automatic  X-Frame-Options: SAMEORIGIN
    allowIframeEmbedding: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'encrypted-media=(), fullscreen=(), autoplay=()',
          },
          {
            key: 'Content-Security-Policy',
            // Allow Warpcast (prod + preview) to embed the site
            value: "frame-ancestors 'self' https://*.farcaster.xyz",
          },
        ],
      },
    ];
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images:   { unoptimized: true },
};

export default nextConfig;