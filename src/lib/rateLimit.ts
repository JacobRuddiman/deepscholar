import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting utilities for API routes
 * Uses in-memory store for simplicity. For production with multiple instances,
 * use Redis or similar distributed cache.
 */

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;
  /**
   * Time window in milliseconds
   */
  window: number;
  /**
   * Custom identifier function (defaults to IP address)
   */
  keyGenerator?: (request: NextRequest) => string;
  /**
   * Custom error message
   */
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limit data
// For production, use Redis: https://github.com/vercel/next.js/tree/canary/examples/api-routes-rate-limit
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Default key generator (uses IP address)
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? (forwarded.split(',')[0] ?? '').trim() : (request as NextRequest & { ip?: string }).ip || 'unknown';
  return `ratelimit:${ip}`;
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    limit,
    window,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests, please try again later.',
  } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(request);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + window,
      };
      rateLimitStore.set(key, entry);
      return null; // Allow request
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      return NextResponse.json(
        {
          error: message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetAt.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return null; // Allow request
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes
   */
  AUTH: {
    limit: 5,
    window: 15 * 60 * 1000,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },

  /**
   * Standard rate limit for API endpoints
   * 100 requests per minute
   */
  API: {
    limit: 100,
    window: 60 * 1000,
    message: 'Too many API requests. Please try again in a minute.',
  },

  /**
   * Strict rate limit for write operations
   * 20 requests per minute
   */
  WRITE: {
    limit: 20,
    window: 60 * 1000,
    message: 'Too many write operations. Please slow down.',
  },

  /**
   * Lenient rate limit for read operations
   * 200 requests per minute
   */
  READ: {
    limit: 200,
    window: 60 * 1000,
    message: 'Too many requests. Please try again shortly.',
  },

  /**
   * Very strict rate limit for expensive operations
   * 3 requests per minute
   */
  EXPENSIVE: {
    limit: 3,
    window: 60 * 1000,
    message: 'This operation is rate limited. Please wait before trying again.',
  },

  /**
   * Rate limit for search queries
   * 30 requests per minute
   */
  SEARCH: {
    limit: 30,
    window: 60 * 1000,
    message: 'Too many search requests. Please try again shortly.',
  },
} as const;

/**
 * Helper function to apply rate limit to a route handler
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const limiter = rateLimit(config);
    const rateLimitResponse = await limiter(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}

/**
 * Rate limit by user ID instead of IP
 */
export function rateLimitByUser(config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (request) => {
      // Extract user ID from session/token
      // This is a placeholder - implement based on your auth system
      const userId = request.headers.get('x-user-id') || 'anonymous';
      return `ratelimit:user:${userId}`;
    },
  });
}

/**
 * Rate limit by API key
 */
export function rateLimitByApiKey(config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (request) => {
      const apiKey = request.headers.get('x-api-key') || 'none';
      return `ratelimit:apikey:${apiKey}`;
    },
  });
}

/**
 * Sliding window rate limiter (more accurate than fixed window)
 */
export function slidingWindowRateLimit(config: RateLimitConfig) {
  const { limit, window, message = 'Too many requests' } = config;
  const requests = new Map<string, number[]>();

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = (config.keyGenerator || defaultKeyGenerator)(request);
    const now = Date.now();
    const windowStart = now - window;

    // Get or create request timestamps for this key
    let timestamps = requests.get(key) || [];

    // Remove timestamps outside the current window
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    if (timestamps.length >= limit) {
      const oldestTimestamp = timestamps[0]!;
      const retryAfter = Math.ceil((oldestTimestamp + window - now) / 1000);

      return NextResponse.json(
        { error: message, retryAfter },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (oldestTimestamp + window).toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Add current timestamp
    timestamps.push(now);
    requests.set(key, timestamps);

    return null;
  };
}

/**
 * Token bucket rate limiter (allows burst traffic)
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  take(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

/**
 * Create a token bucket rate limiter
 */
export function createTokenBucketLimiter(capacity: number, refillRate: number) {
  const buckets = new Map<string, TokenBucket>();

  return async (
    request: NextRequest,
    tokens: number = 1
  ): Promise<NextResponse | null> => {
    const key = defaultKeyGenerator(request);

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(capacity, refillRate);
      buckets.set(key, bucket);
    }

    if (!bucket.take(tokens)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': capacity.toString(),
            'X-RateLimit-Remaining': bucket.getAvailableTokens().toString(),
          },
        }
      );
    }

    return null;
  };
}
