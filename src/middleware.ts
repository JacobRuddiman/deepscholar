import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRateLimiter } from '@/lib/validation';

// Create rate limiters for different endpoint types
const apiRateLimiter = createRateLimiter(100, 60 * 1000); // 100 requests per minute
const authRateLimiter = createRateLimiter(10, 60 * 1000); // 10 requests per minute for auth
const uploadRateLimiter = createRateLimiter(5, 60 * 1000); // 5 uploads per minute
const adminRateLimiter = createRateLimiter(50, 60 * 1000); // 50 requests per minute for admin

// CORS configuration
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Always allow the app's own origin
  const appUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  if (appUrl) {
    origins.push(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`);
  }

  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:3001');
  }

  // Allow additional origins from env var (comma-separated)
  const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (additionalOrigins) {
    origins.push(...additionalOrigins.split(',').map((o) => o.trim()).filter(Boolean));
  }

  return origins;
}

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = getAllowedOrigins();

  // Check if origin is allowed — deny all if no origins configured (fail-closed)
  const isAllowed = allowedOrigins.length > 0 && allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours preflight cache
  };

  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback for unknown IP
  return 'unknown';
}

function createRateLimitResponse(retryAfter = 60) {
  return new NextResponse(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + retryAfter * 1000).toString(),
      },
    }
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for static files and internal Next.js routes
  // SECURITY: Only skip for non-API paths with file extensions to prevent bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    (!pathname.startsWith('/api/') && pathname.includes('.')) ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Handle CORS preflight (OPTIONS) requests for API routes
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(request);
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Enforce request body size limits for API routes
  if (pathname.startsWith('/api/')) {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      // Upload routes: 10MB limit; all other API routes: 5MB limit
      const isUploadRoute = pathname.includes('/upload');
      const maxSize = isUploadRoute ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

      if (size > maxSize) {
        return new NextResponse(
          JSON.stringify({
            error: 'Payload too large',
            message: `Request body exceeds the ${isUploadRoute ? '10MB' : '5MB'} size limit.`,
          }),
          {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  }

  // Get client identifier (IP address)
  const clientIP = getClientIP(request);
  const identifier = `${clientIP}:${pathname}`;

  // Apply rate limiting based on route
  try {
    if (pathname.startsWith('/api/')) {
      // Auth endpoints - stricter rate limiting
      if (pathname.includes('/auth/') || pathname.includes('/signin')) {
        if (authRateLimiter(identifier)) {
          console.warn(`Rate limit exceeded for auth endpoint: ${pathname} from IP: ${clientIP}`);
          return createRateLimitResponse(300); // 5 minute retry for auth
        }
      }
      // Upload endpoints - strict rate limiting
      else if (pathname.includes('/upload')) {
        if (uploadRateLimiter(identifier)) {
          console.warn(`Rate limit exceeded for upload endpoint: ${pathname} from IP: ${clientIP}`);
          return createRateLimitResponse(120); // 2 minute retry for uploads
        }
      }
      // Admin endpoints - moderate rate limiting
      else if (pathname.includes('/admin/')) {
        if (adminRateLimiter(identifier)) {
          console.warn(`Rate limit exceeded for admin endpoint: ${pathname} from IP: ${clientIP}`);
          return createRateLimitResponse(60); // 1 minute retry for admin
        }
      }
      // General API endpoints
      else {
        if (apiRateLimiter(identifier)) {
          console.warn(`Rate limit exceeded for API endpoint: ${pathname} from IP: ${clientIP}`);
          return createRateLimitResponse(60); // 1 minute retry for general API
        }
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue without rate limiting if there's an error
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Add CSRF protection headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add rate limit headers and CORS headers for API requests
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Window', '60');

    // Add CORS headers to API responses
    const corsHeaders = getCorsHeaders(request);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
