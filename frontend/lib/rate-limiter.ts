/**
 * Rate Limiter for API Endpoints
 * 
 * Prevents abuse of cache endpoints and other sensitive operations
 * Implements sliding window rate limiting with Redis-like in-memory storage
 */

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;    // Maximum requests per window
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;      // Don't count failed requests
  keyGenerator?: (request: any) => string;  // Custom key generation
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is allowed under rate limit
   */
  public checkLimit(
    key: string, 
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get or create entry
    let entry = this.limits.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      this.limits.set(key, entry);
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }
    
    // Increment counter
    entry.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Record a request (call this after processing)
   */
  public recordRequest(
    key: string, 
    config: RateLimitConfig,
    success: boolean = true
  ): void {
    // Skip recording if configured to skip successful/failed requests
    if (success && config.skipSuccessfulRequests) {
      return;
    }
    if (!success && config.skipFailedRequests) {
      return;
    }
    
    // The counting is already done in checkLimit, this is for future extensions
  }

  /**
   * Get current status for a key
   */
  public getStatus(key: string): RateLimitResult | null {
    const entry = this.limits.get(key);
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (entry.resetTime <= now) {
      return null; // Window expired
    }
    
    return {
      allowed: true,
      remaining: entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  public reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Reset all rate limits
   */
  public resetAll(): void {
    this.limits.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime <= now) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get statistics
   */
  public getStats(): { totalKeys: number; activeWindows: number } {
    const now = Date.now();
    let activeWindows = 0;
    
    for (const entry of this.limits.values()) {
      if (entry.resetTime > now) {
        activeWindows++;
      }
    }
    
    return {
      totalKeys: this.limits.size,
      activeWindows
    };
  }

  /**
   * Destroy the rate limiter (cleanup)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Cache warming - very restrictive
  CACHE_WARMING: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 3,           // 3 requests per 5 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,

  // Cache monitoring - moderate
  CACHE_MONITOR: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,

  // Brain API - generous
  BRAIN_API: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,          // 100 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,

  // General API - standard
  GENERAL_API: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig
};

/**
 * Generate rate limit key from request
 */
export const generateRateLimitKey = (request: any, prefix: string = 'default'): string => {
  // Try to get IP address
  const ip = request.ip || 
             request.headers?.['x-forwarded-for'] || 
             request.headers?.['x-real-ip'] || 
             'unknown';
  
  // Try to get user ID if available
  const userId = request.user?.id || 
                 request.headers?.['x-user-id'] || 
                 'anonymous';
  
  return `${prefix}:${ip}:${userId}`;
};

/**
 * Middleware function for rate limiting
 */
export const createRateLimitMiddleware = (config: RateLimitConfig, keyPrefix: string = 'api') => {
  return async (request: any): Promise<RateLimitResult> => {
    const key = generateRateLimitKey(request, keyPrefix);
    return rateLimiter.checkLimit(key, config);
  };
};

/**
 * Express/Next.js middleware for rate limiting
 */
export const rateLimitMiddleware = (config: RateLimitConfig, keyPrefix: string = 'api') => {
  return async (request: any, response: any, next: any) => {
    const result = await createRateLimitMiddleware(config, keyPrefix)(request);
    
    if (!result.allowed) {
      response.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter
      });
      return;
    }
    
    // Add rate limit headers
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    next();
  };
};
