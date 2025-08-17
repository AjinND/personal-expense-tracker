// src/lib/env.ts
/**
 * Environment configuration helper
 * Provides type-safe access to environment variables
 */

export const env = {
  // App environment
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  DEBUG: process.env.DEBUG === 'true',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development-only',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION || '7200000'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '5'),
  RATE_LIMIT_BLOCK: parseInt(process.env.RATE_LIMIT_BLOCK || '3600000'),
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Logging
  ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
  
  // Helper functions
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  isDebugEnabled: () => process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true',
} as const;

// Validation for required environment variables
export function validateEnv() {
  const required = {
    MONGODB_URI: env.MONGODB_URI,
    JWT_SECRET: env.JWT_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value || value.includes('fallback'))
    .map(([key]) => key);

  if (missing.length > 0 && env.isProduction()) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}`
    );
  }

  if (missing.length > 0 && env.isDevelopment()) {
    console.warn(
      `⚠️ Using fallback values for environment variables: ${missing.join(', ')}\n` +
      'Consider setting these in your .env.local file for better security.'
    );
  }

  // Validate JWT secrets in production
  if (env.isProduction()) {
    if (env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
    if (env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    }
  }

  return true;
}

// Environment-specific configurations
export const config = {
  // Database connection options
  database: {
    options: env.isProduction() 
      ? {
          bufferCommands: false,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4, // Use IPv4, skip trying IPv6
        }
      : {
          bufferCommands: false,
        },
  },
  
  // API configuration
  api: {
    timeout: env.isProduction() ? 30000 : 10000,
    retries: env.isProduction() ? 3 : 1,
  },
  
  // Logging configuration
  logging: {
    level: env.isDevelopment() ? 'debug' : 'info',
    enabled: env.ENABLE_REQUEST_LOGGING,
  },
  
  // Feature flags
  features: {
    debugComponents: env.isDebugEnabled(),
    analytics: env.isProduction(),
    serviceWorker: env.isProduction(),
    errorReporting: env.isProduction(),
  },
} as const;

// Type exports for better TypeScript support
export type Environment = typeof env.NODE_ENV;
export type Config = typeof config;

// Development helpers
export const devHelpers = {
  // Log environment status
  logStatus: () => {
    if (env.isDevelopment()) {
      console.log('🚀 Environment Status:');
      console.log(`  NODE_ENV: ${env.NODE_ENV}`);
      console.log(`  DEBUG: ${env.DEBUG}`);
      console.log(`  Database: ${env.MONGODB_URI.includes('localhost') ? 'Local' : 'Remote'}`);
      console.log(`  Debug Components: ${config.features.debugComponents ? 'Enabled' : 'Disabled'}`);
    }
  },
  
  // Check if all required env vars are set
  checkEnv: () => {
    try {
      validateEnv();
      console.log('✅ Environment validation passed');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Environment validation failed:', message);
      return false;
    }
  },
  
  // Get current configuration summary
  getConfigSummary: () => ({
    environment: env.NODE_ENV,
    debug: env.DEBUG,
    features: config.features,
    database: env.MONGODB_URI.includes('localhost') ? 'local' : 'remote',
    logging: config.logging.enabled,
  }),
} as const;