// src/lib/env.ts
/**
 * Centralized Environment Configuration
 * Provides type-safe access to all environment variables
 * Validates required variables and provides defaults
 */

// Environment variable types
type NodeEnv = 'development' | 'production' | 'test';

// Core environment configuration
export const env = {
  // App environment
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || 'development',
  DEBUG: process.env.DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Expense Tracker',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',
  DATABASE_NAME: process.env.DATABASE_NAME || '',
  
  // Authentication & Security
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  
  // Authentication limits
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION || '7200000', 10), // 2 hours
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10), // 24 hours
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '5', 10),
  RATE_LIMIT_BLOCK: parseInt(process.env.RATE_LIMIT_BLOCK || '3600000', 10), // 1 hour
  
  // API Configuration
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10), // 30 seconds
  API_RETRIES: parseInt(process.env.API_RETRIES || '3', 10),
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  
  // Logging & Monitoring
  ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
  ENABLE_ERROR_REPORTING: process.env.ENABLE_ERROR_REPORTING === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Performance & Optimization
  ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION !== 'false', // Enabled by default
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false', // Enabled by default
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
  
  // Feature flags
  ENABLE_DEBUG_PANEL: process.env.ENABLE_DEBUG_PANEL !== 'false', // Enabled by default in dev
  ENABLE_MAINTENANCE_MODE: process.env.ENABLE_MAINTENANCE_MODE === 'true',
  ENABLE_BUDGET_FEATURES: process.env.ENABLE_BUDGET_FEATURES !== 'false', // Enabled by default
  ENABLE_EXPORT_FEATURES: process.env.ENABLE_EXPORT_FEATURES !== 'false', // Enabled by default
  
  // Email & Notifications (if needed in future)
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'console', // console, smtp, sendgrid
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  
  // External services (if needed)
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL,
  EXTERNAL_API_KEY: process.env.EXTERNAL_API_KEY,
  
  // CDN & Asset configuration
  CDN_URL: process.env.CDN_URL,
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
  
  // Helper functions
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',
  isDebugEnabled: () => env.DEBUG || (env.NODE_ENV === 'development' && env.ENABLE_DEBUG_PANEL),
  
  // Runtime checks
  isClient: () => typeof window !== 'undefined',
  isServer: () => typeof window === 'undefined',
} as const;

// Validation for required environment variables
export function validateEnv() {
  const errors: string[] = [];
  
  // Critical environment variables that must be set in production
  const requiredInProduction = {
    MONGODB_URI: env.MONGODB_URI,
    JWT_SECRET: env.JWT_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  };

  // Check for missing required variables
  const missing = Object.entries(requiredInProduction)
    .filter(([key, value]) => !value || value.includes('fallback'))
    .map(([key]) => key);

  if (missing.length > 0 && env.isProduction()) {
    errors.push(`Missing required environment variables in production: ${missing.join(', ')}`);
  }

  // Validate JWT secrets in production
  if (env.isProduction()) {
    if (env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production');
    }
    if (env.JWT_REFRESH_SECRET.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    }
  }

  // Validate numeric values
  if (env.BCRYPT_ROUNDS < 8 || env.BCRYPT_ROUNDS > 15) {
    errors.push('BCRYPT_ROUNDS must be between 8 and 15');
  }

  if (env.MAX_LOGIN_ATTEMPTS < 1) {
    errors.push('MAX_LOGIN_ATTEMPTS must be at least 1');
  }

  // Validate database URI
  if (!env.MONGODB_URI.startsWith('mongodb')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Throw errors if validation fails
  if (errors.length > 0) {
    if (env.isProduction()) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    } else {
      console.warn('⚠️ Environment validation warnings:');
      errors.forEach(error => console.warn(`  - ${error}`));
    }
  }

  // Show development warnings
  if (env.isDevelopment() && missing.length > 0) {
    console.warn(
      `⚠️ Using fallback values for environment variables: ${missing.join(', ')}\n` +
      'Consider setting these in your .env.local file for better security.'
    );
  }

  return errors.length === 0;
}

// Environment-specific configurations
export const config = {
  // Database connection options
  database: {
    options: env.isProduction() 
      ? {
          bufferCommands: false,
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000,
          family: 4, // Use IPv4, skip trying IPv6
          retryWrites: true,
          retryReads: true,
        }
      : {
          bufferCommands: false,
          maxPoolSize: 5,
        },
    uri: env.MONGODB_URI,
    name: env.DATABASE_NAME,
  },
  
  // Authentication configuration
  auth: {
    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    bcrypt: {
      rounds: env.BCRYPT_ROUNDS,
    },
    limits: {
      maxAttempts: env.MAX_LOGIN_ATTEMPTS,
      lockoutDuration: env.LOCKOUT_DURATION,
      sessionTimeout: env.SESSION_TIMEOUT,
    },
  },
  
  // Rate limiting configuration
  rateLimit: {
    window: env.RATE_LIMIT_WINDOW,
    max: env.RATE_LIMIT_MAX,
    blockDuration: env.RATE_LIMIT_BLOCK,
  },
  
  // API configuration
  api: {
    timeout: env.API_TIMEOUT,
    retries: env.API_RETRIES,
    maxBodySize: '1mb',
    compression: env.ENABLE_COMPRESSION,
  },
  
  // Security configuration
  security: {
    cors: {
      origins: env.ALLOWED_ORIGINS,
      credentials: true,
    },
    headers: {
      contentSecurityPolicy: env.isProduction()
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
        : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:;",
    },
  },
  
  // Caching configuration
  cache: {
    enabled: env.ENABLE_CACHING,
    ttl: env.CACHE_TTL,
    keys: {
      dashboard: 'dashboard_',
      expenses: 'expenses_',
      budget: 'budget_',
    },
  },
  
  // Logging configuration
  logging: {
    level: env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
    enabled: env.ENABLE_REQUEST_LOGGING,
    errorReporting: env.ENABLE_ERROR_REPORTING,
    analytics: env.ENABLE_ANALYTICS,
  },
  
  // Feature flags
  features: {
    debugPanel: env.isDebugEnabled() && env.ENABLE_DEBUG_PANEL,
    maintenanceMode: env.ENABLE_MAINTENANCE_MODE,
    budgetFeatures: env.ENABLE_BUDGET_FEATURES,
    exportFeatures: env.ENABLE_EXPORT_FEATURES,
    analytics: env.ENABLE_ANALYTICS && env.isProduction(),
    errorReporting: env.ENABLE_ERROR_REPORTING && env.isProduction(),
    compression: env.ENABLE_COMPRESSION,
    caching: env.ENABLE_CACHING,
  },
  
  // Upload configuration
  uploads: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/csv', 'application/json'],
  },
  
  // Client-side configuration (safe to expose)
  client: {
    appName: env.APP_NAME,
    appVersion: env.APP_VERSION,
    debug: env.isDebugEnabled(),
    features: {
      debugPanel: env.isDebugEnabled() && env.ENABLE_DEBUG_PANEL,
      budgetFeatures: env.ENABLE_BUDGET_FEATURES,
      exportFeatures: env.ENABLE_EXPORT_FEATURES,
    },
  },
} as const;

// Type exports for better TypeScript support
export type Environment = typeof env.NODE_ENV;
export type Config = typeof config;
export type ClientConfig = typeof config.client;

// Development helpers
export const devHelpers = {
  // Log environment status
  logStatus: () => {
    if (env.isDevelopment()) {
      console.group('🚀 Environment Status');
      console.log(`NODE_ENV: ${env.NODE_ENV}`);
      console.log(`DEBUG: ${env.DEBUG}`);
      console.log(`Database: ${env.MONGODB_URI.includes('localhost') ? 'Local' : 'Remote'}`);
      console.log(`Debug Panel: ${config.features.debugPanel ? 'Enabled' : 'Disabled'}`);
      console.log(`Features:`, {
        budget: config.features.budgetFeatures,
        export: config.features.exportFeatures,
        analytics: config.features.analytics,
        caching: config.features.caching,
        compression: config.features.compression,
      });
      console.groupEnd();
    }
  },
  
  // Check if all required env vars are set
  checkEnv: () => {
    try {
      const isValid = validateEnv();
      console.log(isValid ? '✅ Environment validation passed' : '⚠️ Environment has warnings');
      return isValid;
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
    security: {
      jwtSecretsSet: !env.JWT_SECRET.includes('fallback'),
      corsEnabled: config.security.cors.origins.length > 0,
      rateLimitEnabled: config.rateLimit.max > 0,
    },
    performance: {
      caching: config.cache.enabled,
      compression: config.api.compression,
    },
  }),
  
} as const;

// Auto-validate environment on import in development
if (env.isDevelopment() && !env.isTest()) {
  try {
    validateEnv();
  } catch (error) {
    console.error('Environment validation failed on import:', error);
  }
}