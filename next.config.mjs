/** @type {import('next').NextConfig} */
// Force redeploy: 2026-02-16-v17
const nextConfig = {
  async redirects() {
    return [
      { source: '/nba/trends', destination: '/nba/streaks', permanent: true },
      { source: '/mlb/trends', destination: '/mlb/streaks', permanent: true },
      { source: '/nfl/trends', destination: '/nfl/streaks', permanent: true },
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Enable image optimization for production
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.mlbstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.fantasypros.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable compression
  compress: true,
  // Generate standalone output for optimized deployment
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  // Optimize bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'posthog-js',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
}

export default nextConfig
