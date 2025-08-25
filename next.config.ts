// next.config.ts - Enhanced configuration with Debug System
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Server components optimization
    serverComponentsExternalPackages: ['mongoose'],
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      
      // DEBUG SYSTEM: Replace debug calls with no-ops in production
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/utils/debug': path.resolve(__dirname, 'src/utils/debug-production.ts')
      };
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // DEBUG SYSTEM: Add debug-friendly CSP in development
          ...(process.env.NODE_ENV === 'development' ? [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' ws: wss:;"
            }
          ] : [])
        ]
      }
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      // Add any redirects here
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    // DEBUG SYSTEM: Debug control environment variables
    CUSTOM_DEBUG_ENABLED: (process.env.NODE_ENV === 'development').toString(),
    DEBUG_BUILD_TIME: new Date().toISOString(),
  },
  
  // DEBUG SYSTEM: Compiler options for production optimization
  compiler: {
    // Remove console.log in production (but keep error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // 🐛 DEBUG SYSTEM: Ensure debug code is completely removed in production
    eslint: {
      // Disable ESLint during builds to speed up production builds
      ignoreDuringBuilds: false,
    },
    typescript: {
      // Disable type checking during builds if needed for speed
      ignoreBuildErrors: false,
    },
  }),
  
  // Development-specific configurations
  ...(process.env.NODE_ENV === 'development' && {
    // DEBUG SYSTEM: Enable detailed webpack build info in development
    webpack: (config, { dev, isServer }) => {
      // Original webpack config
      if (!dev && !isServer) {
        config.optimization.splitChunks.chunks = 'all';
      }
      
      // DEBUG SYSTEM: Add webpack build performance tracking
      if (dev) {
        config.plugins = config.plugins || [];
        
        // Add build timing plugin for debug
        class BuildTimePlugin {
          apply(compiler: any) {
            compiler.hooks.compile.tap('BuildTimePlugin', () => {
              console.log('🔨 [DEBUG] Webpack compilation started...');
            });
            
            compiler.hooks.done.tap('BuildTimePlugin', (stats: any) => {
              const buildTime = stats.endTime - stats.startTime;
              console.log(`✅ [DEBUG] Webpack compilation completed in ${buildTime}ms`);
            });
          }
        }
        
        config.plugins.push(new BuildTimePlugin());
      }
      
      return config;
    },
  }),
  
  // Bundle analyzer (keep your existing functionality)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, options) => {
      // Apply existing webpack config first
      if (!options.dev && !options.isServer) {
        config.optimization.splitChunks.chunks = 'all';
        
        // Add debug system production alias
        config.resolve.alias = {
          ...config.resolve.alias,
          '@/utils/debug': path.resolve(__dirname, 'src/utils/debug-production.ts')
        };
      }
      
      // Then add bundle analyzer
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
      config.plugins.push(new BundleAnalyzerPlugin());
      
      return config;
    },
  }),
  
  // DEBUG SYSTEM: Rewrites for debug API endpoints in development
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      // Debug API endpoints - only in development
      {
        source: '/debug/:path*',
        destination: '/api/debug/:path*',
      },
    ] : [];
  },
  
  // DEBUG SYSTEM: Custom server configuration for development
  ...(process.env.NODE_ENV === 'development' && {
    // Enable source maps in development for better debugging
    productionBrowserSourceMaps: false, // Keep false for production
    // But enable them in development
    generateBuildId: async () => {
      return `debug-build-${new Date().toISOString()}`;
    },
  }),
};

export default nextConfig;