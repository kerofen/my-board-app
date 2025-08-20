/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode for development
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Production optimizations
  
  // Compress output with gzip and brotli
  compress: true,
  
  // Optimize CSS
  productionBrowserSourceMaps: false,
  
  // Power off source maps in production
  
  // Generate build ID
  generateBuildId: async () => {
    return Date.now().toString()
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['mongoose', 'react', 'react-dom'],
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Tree shaking optimization
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    }
    
    // Production optimizations
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/components': require('path').resolve(__dirname, 'components'),
        '@/lib': require('path').resolve(__dirname, 'lib'),
        '@/models': require('path').resolve(__dirname, 'models'),
      }
    }
    
    return config
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig