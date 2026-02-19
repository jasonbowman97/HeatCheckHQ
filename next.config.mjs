import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/nba/trends', destination: '/nba/streaks', permanent: true },
      { source: '/mlb/trends', destination: '/mlb/streaks', permanent: true },
      { source: '/nfl/trends', destination: '/nfl/streaks', permanent: true },
      { source: '/criteria', destination: '/alerts', permanent: true },
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

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Upload source maps for better stack traces (requires SENTRY_AUTH_TOKEN)
  widenClientFileUpload: true,
  // Disable Sentry telemetry
  telemetry: false,
  // Don't add Sentry to middleware (it has its own edge config)
  disableLogger: true,
  // Tree-shake Sentry debug code in production
  hideSourceMaps: true,
})
