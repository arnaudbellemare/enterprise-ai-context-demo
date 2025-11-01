/**
 * Next.js Edge Middleware
 *
 * Provides centralized authentication and rate limiting for API routes
 * Runs on Vercel Edge Network for low latency
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimiter, RATE_LIMITS, type RateLimitConfig } from './lib/rate-limiter';

// API routes that require authentication
const PROTECTED_ROUTES = [
  '/api/brain-evaluation',
  '/api/benchmark/run-real',
  '/api/benchmark/real',
  '/api/continual-learning-real',
  '/api/dspy/test-rag',
  '/api/unified-pipeline',
  '/api/gepa-dspy/optimize',
  '/api/parallel-execution',
  '/api/dynamic-scaling',
  '/api/hybrid-system',
  '/api/quality-first-training',
  '/api/scalable-data-system',
  '/api/agentic-retrieval',
  '/api/playbook/expert-edit',
];

// API routes that are public (no auth required)
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/status',
  '/api/universal-art-valuation',
  '/api/permutation-ai-valuation',
  '/api/art-deco-cartier-valuation',
  '/api/unified-pipeline',
  '/api/arena/execute-swirl-trm-full',
];

/**
 * Check if route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  // Check if explicitly public
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return false;
  }

  // Check if explicitly protected
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Default: all /api/* routes require auth unless explicitly public
  return pathname.startsWith('/api/');
}

/**
 * Verify Supabase JWT token
 */
async function verifyAuth(request: NextRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return { valid: false, error: 'Server configuration error' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    return { valid: true, userId: user.id };

  } catch (error) {
    console.error('Auth verification error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

/**
 * Get rate limit config for route
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.includes('/benchmark') || pathname.includes('/optimize')) {
    return {
      windowMs: 5 * 60 * 1000,  // 5 minutes
      maxRequests: 10,
    };
  }
  if (pathname.includes('/brain')) {
    return RATE_LIMITS.BRAIN_API;
  }
  return RATE_LIMITS.GENERAL_API;
}

/**
 * Get identifier for rate limiting
 */
function getRateLimitKey(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `ip:${ip}`;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitKey = getRateLimitKey(request);
    const rateLimitConfig = getRateLimitConfig(pathname);
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }
  }

  // Check if route requires authentication
  if (requiresAuth(pathname)) {
    const authResult = await verifyAuth(request);

    if (!authResult.valid) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: authResult.error || 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API", error="invalid_token"'
          }
        }
      );
    }

    // Add user ID to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authResult.userId || '');

    // Continue with modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return addSecurityHeaders(response);
  }

  // For non-protected routes, just add security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
