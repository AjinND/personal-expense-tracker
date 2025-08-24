// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClientIdentifier } from '@/lib/rate-limit';

// Security configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), location=(), payment=()',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// CSP policy for production
const CSP_POLICY = process.env.NODE_ENV === 'production' 
  ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
  : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:";

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/auth': { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  '/api/auth/session': { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  '/api/expenses': { requests: 100, window: 60 * 1000 }, // 100 requests per minute for expenses
  '/api/budget': { requests: 50, window: 60 * 1000 }, // 50 requests per minute for budget
  '/api/dashboard': { requests: 100, window: 60 * 1000 }, // 100 requests per minute for dashboard
  default: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
};

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(pathname: string) {
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return limit;
    }
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(clientId: string, pathname: string): boolean {
  const now = Date.now();
  const rateLimit = getRateLimit(pathname);
  const key = `${clientId}:${pathname}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rateLimit.window
    });
    return true;
  }
  
  if (current.count >= rateLimit.requests) {
    return false;
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  return true;
}

// Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Create response
  let response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP header
  response.headers.set('Content-Security-Policy', CSP_POLICY);

  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api') && pathname !== '/api/health') {
    const clientId = getClientIdentifier(request);
    
    if (!checkRateLimit(clientId, pathname)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900',
            ...SECURITY_HEADERS
          }
        }
      );
    }

    // Add request size limit for API routes
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024) { // 10KB limit
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Request body too large',
          code: 'PAYLOAD_TOO_LARGE'
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            ...SECURITY_HEADERS
          }
        }
      );
    }

    // Validate Content-Type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Invalid Content-Type. Expected application/json',
            code: 'INVALID_CONTENT_TYPE'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...SECURITY_HEADERS
            }
          }
        );
      }
    }
  }

  // Handle CORS for API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://localhost:3000'
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
          ...SECURITY_HEADERS
        }
      });
    }
  }

  // Block suspicious requests
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /scan/i,
    /hack/i,
    /sql/i,
    /injection/i,
    /script/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent) || 
    pattern.test(pathname) || 
    pattern.test(request.nextUrl.search)
  );

  if (isSuspicious && process.env.NODE_ENV === 'production') {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Access denied',
        code: 'SUSPICIOUS_REQUEST'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...SECURITY_HEADERS
        }
      }
    );
  }

  // Log requests in development
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_REQUEST_LOGGING === 'true') {
    console.log(`${request.method} ${pathname} - ${getClientIdentifier(request)}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};