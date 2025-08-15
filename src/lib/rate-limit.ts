// src/lib/rate-limit.ts
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export default function rateLimit(config: RateLimitConfig) {
  const tokenCache = new Map<string, RateLimitRecord>();

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const now = Date.now();
      const record = tokenCache.get(token);

      if (!record || now > record.resetTime) {
        // Create new record or reset expired one
        tokenCache.set(token, {
          count: 1,
          resetTime: now + config.interval,
        });
        return;
      }

      if (record.count >= limit) {
        throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`);
      }

      // Increment count
      record.count++;
      tokenCache.set(token, record);
    },
  };
}

// Helper function to get client identifier
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || req.ip || 'unknown';
  
  // You could also include user agent for more granular limiting
  const userAgent = req.headers.get('user-agent') || '';
  
  return `${ip}:${userAgent.slice(0, 50)}`;
}