/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Experimental features
  experimental: {
    // Remove the unsupported staticWorkerRequestDeduplication option
  },
  // Ensure we don't have 404s for static assets
  webpack: (config, { isServer }) => {
    // Handle static files better
    if (!isServer) {
      config.output.publicPath = '/_next/';
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-read=(self), clipboard-write=(self)',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        // Add explicit headers for API routes to prevent caching
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ],
      },
    ]
  },
}

export default nextConfig
