// next.config.ts
import type { NextConfig } from 'next';
import path from 'path';
import { env, config } from './src/lib/env';

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Server components optimization
    serverComponentsExternalPackages: ['mongoose'],
  },

  images: {
    domains: [
      'localhost',
      // Add your production domain here
      // 'yourdomain.com'
    ],
    formats: ['image/webp', 'image/avif'],
    // Local images configuration
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Configure API body size limits
  serverRuntimeConfig: {
    // Increase body size limit for file uploads
    maxFileSize: '2mb',
  },

  // Webpack configuration
  webpack: (webpackConfig, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      webpackConfig.optimization.splitChunks.chunks = 'all';

      // Replace debug calls with no-ops in production
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@/utils/debug': path.resolve(__dirname, 'src/utils/debug-production.ts')
      };
    }

    return webpackConfig;
  },

  // Environment variables to expose to client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_APP_NAME: env.APP_NAME,
    NEXT_PUBLIC_APP_VERSION: env.APP_VERSION,
    NEXT_PUBLIC_DEBUG: env.DEBUG.toString(),
    DEBUG_BUILD_TIME: new Date().toISOString(),
  },

  // Security headers
  async headers() {
    const headers = [
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
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), location=(), payment=()'
      },
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ];

    // Add CSP header
    if (config.security.headers.contentSecurityPolicy) {
      headers.push({
        key: 'Content-Security-Policy',
        value: config.security.headers.contentSecurityPolicy
      });
    }

    // Add HSTS header in production
    if (env.isProduction()) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      });
    }

    return [
      {
        source: '/(.*)',
        headers
      }
    ];
  },

  // Redirects
  async redirects() {
    const redirects: Array<{ source: string; destination: string; permanent: boolean }> = [];

    // Redirect to maintenance page if maintenance mode is enabled
    if (config.features.maintenanceMode) {
      redirects.push({
        source: '/((?!maintenance|api|_next|static).*)',
        destination: '/maintenance',
        permanent: false,
      });
    }

    return redirects;
  },

  // Rewrites for API and development features
  async rewrites() {
    const rewrites: Array<{ source: string; destination: string }> = [];

    // Debug API endpoints - only in development
    if (env.isDevelopment()) {
      rewrites.push({
        source: '/debug/:path*',
        destination: '/api/debug/:path*',
      });
    }

    return rewrites;
  },

  // Compiler options for production optimization
  compiler: {
    // Remove console.log in production (but keep error and warn)
    removeConsole: env.isProduction() ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Production optimizations
  ...(env.isProduction() && {
    eslint: {
      // Keep ESLint enabled during builds for quality assurance
      ignoreDuringBuilds: false,
    },
    typescript: {
      // Keep type checking enabled for production builds
      ignoreBuildErrors: false,
    },
    // Enable source maps in production only if debug is enabled
    productionBrowserSourceMaps: env.isDebugEnabled(),
  }),

  // Development-specific configurations
  ...(env.isDevelopment() && {
    // Webpack configuration for development
    webpack: (webpackConfig, { dev, isServer }) => {
      // Apply base webpack config
      if (!dev && !isServer) {
        webpackConfig.optimization.splitChunks.chunks = 'all';
      }

      // Add webpack build performance tracking
      if (dev && config.features.debugPanel) {
        webpackConfig.plugins = webpackConfig.plugins || [];

        class BuildTimePlugin {
          apply(compiler: any) {
            compiler.hooks.compile.tap('BuildTimePlugin', () => {
              console.log('[DEBUG] Webpack compilation started...');
            });

            compiler.hooks.done.tap('BuildTimePlugin', (stats: any) => {
              const buildTime = stats.endTime - stats.startTime;
              console.log(`[DEBUG] Webpack compilation completed in ${buildTime}ms`);
            });
          }
        }

        webpackConfig.plugins.push(new BuildTimePlugin());
      }

      return webpackConfig;
    },

    // Custom build ID for development builds
    generateBuildId: async () => {
      return `dev-build-${new Date().toISOString()}`;
    },
  }),

  // Bundle analyzer (when ANALYZE=true)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (webpackConfig, options) => {
      // Apply base webpack config first
      if (!options.dev && !options.isServer) {
        webpackConfig.optimization.splitChunks.chunks = 'all';

        // Add debug system production alias
        webpackConfig.resolve.alias = {
          ...webpackConfig.resolve.alias,
          '@/utils/debug': path.resolve(__dirname, 'src/utils/debug-production.ts')
        };
      }

      // Add bundle analyzer
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
      webpackConfig.plugins.push(new BundleAnalyzerPlugin());

      return webpackConfig;
    },
  }),

  // Output configuration
  output: env.isProduction() ? 'standalone' : undefined,

  // Performance configuration
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: env.isDevelopment() ? 25 * 1000 : 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: env.isDevelopment() ? 5 : 2,
  },

  // Internationalization (if needed in future)
  // i18n: {
  //   locales: ['en'],
  //   defaultLocale: 'en',
  // },

  // Custom server configuration
  ...(env.isDevelopment() && {
    // Development server options
    devIndicators: {
      buildActivity: config.features.debugPanel,
      buildActivityPosition: 'bottom-right',
    },
  }),
};

// Log configuration in development
if (env.isDevelopment()) {
  console.log('📋 Next.js Configuration Summary:');
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Debug Mode: ${env.DEBUG}`);
  console.log(`  Debug Panel: ${config.features.debugPanel}`);
  console.log(`  Bundle Analyzer: ${process.env.ANALYZE === 'true'}`);
  console.log(`  Source Maps: ${nextConfig.productionBrowserSourceMaps || false}`);
  console.log(`  Maintenance Mode: ${config.features.maintenanceMode}`);
}

export default nextConfig;