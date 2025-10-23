/**
 * WALT Infrastructure Usage Examples
 *
 * Quick reference showing how to use the new production-ready infrastructure
 */

import {
  // Logger
  createLogger,
  loggers,

  // Errors
  WALTError,
  WALTValidationError,
  isWALTError,
  getErrorMessage,
  getErrorDetails,

  // Validation
  validateDiscoveryUrl,
  sanitizeGoal,
  validateMaxTools,

  // Cache
  discoveryCache,
  CacheManager,

  // Cost
  estimateToolExecutionCost,
  formatCost,
} from './index';

// =============================================================================
// 1. STRUCTURED LOGGING
// =============================================================================

// Create a component-specific logger
const logger = createLogger('my-component');

// Basic logging with context
logger.info('Operation started', {
  url: 'https://example.com',
  domain: 'example',
});

// Error logging with details
try {
  throw new Error('Something failed');
} catch (err) {
  logger.error('Operation failed', {
    error: getErrorDetails(err),
    context: 'discovery',
  });
}

// Use pre-configured loggers
loggers.client.info('Client initialized');
loggers.storage.warn('Cache miss', { key: 'example' });

// =============================================================================
// 2. ERROR HANDLING
// =============================================================================

// Throw typed errors with context
function exampleFunction(url: string) {
  try {
    validateDiscoveryUrl(url);
  } catch (err) {
    if (err instanceof WALTValidationError) {
      logger.error('Validation failed', {
        error: err.message,
        details: err.details,
      });
      throw err;
    }

    // Wrap unknown errors
    throw new WALTError('Unexpected error', 'UNKNOWN', {
      originalError: getErrorMessage(err),
    });
  }
}

// Check error types
function handleError(error: unknown) {
  if (isWALTError(error)) {
    console.log('WALT Error:', error.code, error.details);
  } else {
    console.log('Unknown error:', getErrorMessage(error));
  }
}

// =============================================================================
// 3. INPUT VALIDATION
// =============================================================================

async function discoverToolsSafely(url: string, goal: string, maxTools?: number) {
  // Validate URL (throws WALTValidationError on failure)
  validateDiscoveryUrl(url); // Blocks localhost, private IPs, malicious URLs

  // Sanitize goal
  const cleanGoal = sanitizeGoal(goal); // Removes scripts, injection patterns

  // Validate maxTools
  const safeMaxTools = validateMaxTools(maxTools); // Ensures 1-100 range

  logger.info('Discovery request validated', {
    url,
    goal: cleanGoal,
    maxTools: safeMaxTools,
  });

  // Continue with discovery...
}

// =============================================================================
// 4. CACHE MANAGEMENT
// =============================================================================

async function discoverWithCache(url: string, domain: string) {
  // Check cache first
  const cached = discoveryCache.getTools(url, domain);

  if (cached) {
    logger.info('Cache hit', {
      url,
      toolCount: cached.length,
    });
    return cached;
  }

  // Cache miss - do discovery
  logger.info('Cache miss, discovering tools', { url });
  const tools = await performDiscovery(url);

  // Cache results with 24-hour TTL
  discoveryCache.setTools(url, domain, tools, 86400000);

  // Monitor cache performance
  const stats = discoveryCache.getStats();
  logger.info('Cache performance', {
    hitRate: stats.hit_rate,
    size: stats.size,
    capacity: 500,
  });

  return tools;
}

// Create custom cache
const customCache = new CacheManager({
  max: 1000,
  ttl: 3600000, // 1 hour
  updateAgeOnGet: true,
});

// =============================================================================
// 5. COST TRACKING
// =============================================================================

async function executeWithCostTracking(url: string) {
  const startTime = Date.now();

  try {
    // Execute discovery
    const result = await performDiscovery(url);
    const duration = Date.now() - startTime;

    // Calculate cost
    const costBreakdown = estimateToolExecutionCost({
      executionTimeMs: duration,
      discoveryMethod: 'api_endpoint',
      model: 'gpt-4o-mini',
    });

    logger.info('Discovery completed', {
      url,
      toolsFound: result.length,
      duration,
      cost: formatCost(costBreakdown.total_cost),
      llmCost: formatCost(costBreakdown.llm_cost),
      browserCost: formatCost(costBreakdown.browser_cost),
    });

    return {
      tools: result,
      cost: costBreakdown,
    };
  } catch (err) {
    const duration = Date.now() - startTime;

    logger.error('Discovery failed', {
      url,
      duration,
      error: getErrorDetails(err),
    });

    throw err;
  }
}

// =============================================================================
// 6. COMPLETE EXAMPLE: Discovery with All Features
// =============================================================================

export async function productionDiscovery(params: {
  url: string;
  goal?: string;
  maxTools?: number;
}) {
  const logger = createLogger('production-discovery');
  const startTime = Date.now();

  try {
    // 1. Validate inputs
    validateDiscoveryUrl(params.url);
    const cleanGoal = sanitizeGoal(params.goal || '');
    const safeMaxTools = validateMaxTools(params.maxTools);

    const domain = new URL(params.url).hostname.replace('www.', '').split('.')[0];

    logger.info('Discovery started', {
      url: params.url,
      domain,
      goal: cleanGoal,
      maxTools: safeMaxTools,
    });

    // 2. Check cache
    const cached = discoveryCache.getTools(params.url, domain);
    if (cached) {
      const duration = Date.now() - startTime;
      logger.info('Cache hit - returning cached tools', {
        url: params.url,
        toolCount: cached.length,
        duration,
      });
      return {
        success: true,
        tools: cached,
        cached: true,
        duration,
      };
    }

    // 3. Perform discovery
    logger.info('Cache miss - performing discovery', { url: params.url });
    const tools = await performDiscovery(params.url);

    // 4. Cache results
    discoveryCache.setTools(params.url, domain, tools, 86400000);

    // 5. Calculate costs
    const duration = Date.now() - startTime;
    const costBreakdown = estimateToolExecutionCost({
      executionTimeMs: duration,
      discoveryMethod: 'api_endpoint',
    });

    // 6. Log success with full context
    logger.info('Discovery completed successfully', {
      url: params.url,
      domain,
      toolsFound: tools.length,
      duration,
      cost: formatCost(costBreakdown.total_cost),
      cached: false,
    });

    return {
      success: true,
      tools,
      cached: false,
      duration,
      cost: costBreakdown,
    };

  } catch (err) {
    const duration = Date.now() - startTime;

    // Log error with full context
    logger.error('Discovery failed', {
      url: params.url,
      duration,
      error: getErrorDetails(err),
    });

    // Rethrow as WALT error if needed
    if (isWALTError(err)) {
      throw err;
    }

    throw new WALTError('Discovery failed', 'DISCOVERY_ERROR', {
      url: params.url,
      originalError: getErrorMessage(err),
    });
  }
}

// =============================================================================
// HELPER (for examples)
// =============================================================================

async function performDiscovery(url: string) {
  // Placeholder for actual discovery logic
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    { name: 'example_tool_1', description: 'Example tool' },
    { name: 'example_tool_2', description: 'Another tool' },
  ] as any;
}

// =============================================================================
// ENVIRONMENT VALIDATION EXAMPLE
// =============================================================================

import { validateEnvironment } from './validation';

// Check required environment variables on startup
export function validateWALTEnvironment() {
  const validation = validateEnvironment(['REDIS_URL', 'OPENAI_API_KEY']);

  if (!validation.valid) {
    logger.error('Missing required environment variables', {
      missing: validation.missing,
    });
    throw new Error(`Missing environment variables: ${validation.missing.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    validation.warnings.forEach((warning) => {
      logger.warn('Environment configuration warning', { warning });
    });
  }

  logger.info('Environment validation passed');
}
