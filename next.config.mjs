/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict type checking in production
    // Set to true only during development if needed
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
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
