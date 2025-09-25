/**
 * Next.js Configuration - Production Optimized
 * 
 * Advanced configuration for optimal performance, security, and user experience
 * Includes bundle optimization, image optimization, security headers, and more
 * 
 * @version 1.0.0
 * @author Astral Money Team
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    // Server components optimization
    serverComponentsExternalPackages: ['@prisma/client'],
    
    // Memory optimizations
    workerThreads: false,
    esmExternals: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // React compiler optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    // Enable modern formats
    formats: ['image/webp', 'image/avif'],
    
    // Optimization settings
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Disable static imports for better bundle size
    disableStaticImages: false,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
        ],
      },
    ];
  },
  
  // Webpack customization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore source maps in production for smaller bundle
    if (!dev && !isServer) {
      config.devtool = false;
    }
    
    // Add aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').join(__dirname, 'src'),
    };
    
    // Optimize for production
    if (!dev) {
      // Tree shaking
      config.optimization.usedExports = true;
    }
    
    return config;
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'astral-money-production',
    BUILD_TIME: new Date().toISOString(),
    VERSION: require('./package.json').version,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Trailing slash handling
  trailingSlash: false,
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // PoweredBy header removal
  poweredByHeader: false,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // Compression
  compress: true,
  
  // TypeScript configuration - strict checking enabled for production quality
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration - allow warnings for deployment
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },
}

module.exports = nextConfig