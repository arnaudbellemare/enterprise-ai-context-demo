/**
 * Redis Queue-Based WALT Client (IMPROVED VERSION)
 *
 * This is an example showing improvements applied:
 * - Structured logging instead of console.log
 * - Typed errors instead of `error: any`
 * - Input validation for security
 * - Better error handling with context
 *
 * To apply: Review this file and apply similar patterns to redis-queue-client.ts
 */

import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  ToolDiscoveryRequest,
  ToolDiscoveryResponse,
  ToolGenerationRequest,
  ToolGenerationResponse,
} from './types';
import { getNativeWALTDiscovery } from './native-discovery';
import { createLogger } from './logger';
import {
  WALTRedisError,
  WALTTimeoutError,
  WALTValidationError,
  getErrorMessage,
  getErrorDetails,
} from './errors';
import { validateDiscoveryUrl, validateRedisUrl, sanitizeGoal, validateMaxTools } from './validation';

const logger = createLogger('walt:redis-queue');

export interface RedisQueueOptions {
  redisUrl?: string;
  queueName?: string;
  resultPrefix?: string;
  timeout?: number;
  useNativeFallback?: boolean;
}

export interface QueueJob {
  id: string;
  type: 'discover' | 'generate';
  request: ToolDiscoveryRequest | ToolGenerationRequest;
  timestamp: number;
}

export interface QueueResult {
  jobId: string;
  success: boolean;
  data?: ToolDiscoveryResponse | ToolGenerationResponse;
  error?: string;
  processedAt: number;
  processingTime: number;
}

export class RedisWALTClientImproved {
  private redis?: Redis;
  private subscriber?: Redis;
  private queueName: string;
  private resultPrefix: string;
  private timeout: number;
  private useNativeFallback: boolean;
  private nativeDiscovery = getNativeWALTDiscovery();
  private connected: boolean = false;

  constructor(options?: RedisQueueOptions) {
    this.queueName = options?.queueName || 'walt:discovery:queue';
    this.resultPrefix = options?.resultPrefix || 'walt:result:';
    this.timeout = options?.timeout || 300000; // 5 minutes
    this.useNativeFallback = options?.useNativeFallback !== false;

    const redisUrl = options?.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

    // Validate Redis URL
    try {
      validateRedisUrl(redisUrl);
    } catch (err) {
      if (err instanceof WALTValidationError) {
        logger.warn('Invalid Redis URL configuration', { error: err.message });
        if (!this.useNativeFallback) {
          throw err;
        }
        return; // Skip Redis connection, use native fallback
      }
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.debug('Redis retry attempt', { attempt: times, delay });
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.subscriber = new Redis(redisUrl);

      this.redis.on('connect', () => {
        this.connected = true;
        logger.info('Redis client connected', {
          queueName: this.queueName,
          timeout: this.timeout,
        });
      });

      this.redis.on('error', (err) => {
        logger.warn('Redis connection error', {
          error: getErrorMessage(err),
          fallbackAvailable: this.useNativeFallback,
        });
        this.connected = false;
      });

      this.redis.on('close', () => {
        logger.info('Redis connection closed');
        this.connected = false;
      });
    } catch (err) {
      logger.error('Failed to initialize Redis client', {
        error: getErrorDetails(err),
        fallbackAvailable: this.useNativeFallback,
      });

      if (!this.useNativeFallback) {
        throw new WALTRedisError('Redis required but not available', {
          originalError: getErrorMessage(err),
        });
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    const connected = this.connected && this.redis?.status === 'ready';
    logger.debug('Connection status check', { connected, status: this.redis?.status });
    return connected;
  }

  /**
   * Discover tools from a website (async pattern)
   */
  async discoverTools(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    const startTime = Date.now();

    // Validate inputs
    try {
      validateDiscoveryUrl(request.url);
      request.goal = sanitizeGoal(request.goal || '');
      request.max_tools = validateMaxTools(request.max_tools);
    } catch (err) {
      if (err instanceof WALTValidationError) {
        logger.error('Discovery request validation failed', {
          error: err.message,
          details: err.details,
        });
        throw err;
      }
      throw err;
    }

    // Fallback to native if Redis unavailable
    if (!this.isConnected()) {
      if (this.useNativeFallback) {
        logger.info('Redis unavailable, using native TypeScript backend', {
          url: request.url,
          reason: 'not_connected',
        });
        return await this.discoverToolsNative(request);
      }

      throw new WALTRedisError('Redis not connected and fallback disabled', {
        url: request.url,
      });
    }

    const jobId = uuidv4();
    const job: QueueJob = {
      id: jobId,
      type: 'discover',
      request,
      timestamp: Date.now(),
    };

    try {
      // Push job to queue
      await this.redis!.lpush(this.queueName, JSON.stringify(job));

      logger.info('Discovery job queued', {
        jobId,
        url: request.url,
        maxTools: request.max_tools,
      });

      // Wait for result
      const result = await this.waitForResult<ToolDiscoveryResponse>(jobId);

      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        logger.info('Discovery job completed successfully', {
          jobId,
          url: request.url,
          toolsDiscovered: (result.data as ToolDiscoveryResponse).tools_discovered,
          duration,
        });

        return result.data as ToolDiscoveryResponse;
      } else {
        throw new WALTRedisError('Discovery job failed', {
          jobId,
          error: result.error,
        });
      }
    } catch (err) {
      const duration = Date.now() - startTime;

      logger.error('Discovery job error', {
        jobId,
        url: request.url,
        duration,
        error: getErrorDetails(err),
      });

      // Fallback to native
      if (this.useNativeFallback && !(err instanceof WALTTimeoutError)) {
        logger.info('Falling back to native TypeScript backend', {
          url: request.url,
          reason: 'redis_error',
        });
        return await this.discoverToolsNative(request);
      }

      throw err;
    }
  }

  /**
   * Generate a specific tool from a website (async pattern)
   */
  async generateTool(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    // Similar validation and logging patterns as discoverTools
    // ... implementation omitted for brevity

    logger.info('Tool generation requested', {
      url: request.url,
      goal: request.goal,
    });

    if (!this.isConnected()) {
      if (this.useNativeFallback) {
        return await this.generateToolNative(request);
      }
      throw new WALTRedisError('Redis not connected');
    }

    // Implementation continues...
    throw new Error('Not implemented in this example');
  }

  /**
   * Wait for job result with timeout
   * IMPROVEMENT: Better error typing and logging
   */
  private async waitForResult<T>(jobId: string): Promise<QueueResult> {
    const resultKey = `${this.resultPrefix}${jobId}`;
    const resultChannel = `${this.resultPrefix}channel:${jobId}`;

    return new Promise<QueueResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.subscriber?.unsubscribe(resultChannel);
        reject(
          new WALTTimeoutError(`Timeout waiting for result after ${this.timeout}ms`, {
            jobId,
            timeout: this.timeout,
          })
        );
      }, this.timeout);

      // Subscribe to result channel
      this.subscriber?.subscribe(resultChannel, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(
            new WALTRedisError('Failed to subscribe to result channel', {
              jobId,
              channel: resultChannel,
              error: getErrorMessage(err),
            })
          );
        }
      });

      // Handle incoming message
      this.subscriber?.on('message', async (channel, message) => {
        if (channel === resultChannel) {
          clearTimeout(timeoutId);

          try {
            const result = JSON.parse(message) as QueueResult;
            await this.subscriber?.unsubscribe(resultChannel);
            resolve(result);
          } catch (err) {
            reject(
              new WALTRedisError('Failed to parse result', {
                jobId,
                error: getErrorMessage(err),
              })
            );
          }
        }
      });

      // Polling fallback (in case pub/sub misses)
      const pollInterval = setInterval(async () => {
        try {
          const result = await this.redis?.get(resultKey);
          if (result) {
            clearTimeout(timeoutId);
            clearInterval(pollInterval);
            await this.subscriber?.unsubscribe(resultChannel);
            resolve(JSON.parse(result) as QueueResult);
          }
        } catch (err) {
          logger.warn('Polling error', {
            jobId,
            error: getErrorMessage(err),
          });
        }
      }, 1000);
    });
  }

  /**
   * Discover tools using TypeScript native implementation
   * IMPROVEMENT: Better typing and error handling
   */
  private async discoverToolsNative(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    try {
      const result = await this.nativeDiscovery.discoverTools({
        url: request.url,
        goal: request.goal || '',
        maxTools: request.max_tools || 10,
        headless: request.headless !== false,
      });

      const domain = new URL(request.url).hostname.replace('www.', '').split('.')[0];

      logger.info('Native discovery completed', {
        url: request.url,
        toolsFound: result.tools.length,
      });

      return {
        success: true,
        url: request.url,
        domain,
        tools_discovered: result.tools.length,
        tools: result.tools as any,
        output_dir: '',
      } as ToolDiscoveryResponse;
    } catch (err) {
      logger.error('Native discovery failed', {
        url: request.url,
        error: getErrorDetails(err),
      });

      throw new WALTRedisError('Native discovery failed', {
        url: request.url,
        originalError: getErrorMessage(err),
      });
    }
  }

  /**
   * Generate a specific tool using TypeScript native
   * IMPROVEMENT: Better typing and error handling
   */
  private async generateToolNative(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    // Similar improvements as discoverToolsNative
    throw new Error('Not fully implemented in this example');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up Redis connections');

    try {
      await this.redis?.quit();
      await this.subscriber?.quit();
      await this.nativeDiscovery.cleanup();

      logger.info('Cleanup completed successfully');
    } catch (err) {
      logger.error('Cleanup error', {
        error: getErrorDetails(err),
      });
    }
  }
}

/**
 * SUMMARY OF IMPROVEMENTS:
 *
 * 1. Structured Logging:
 *    - Replaced console.log with logger.info/warn/error/debug
 *    - Added contextual information (jobId, url, duration, etc.)
 *    - Consistent formatting and levels
 *
 * 2. Type Safety:
 *    - Replaced `error: any` with proper error types (WALTRedisError, WALTTimeoutError)
 *    - Used getErrorMessage() and getErrorDetails() helper functions
 *    - Better error context with details object
 *
 * 3. Input Validation:
 *    - validateDiscoveryUrl() checks for SSRF and malicious URLs
 *    - sanitizeGoal() removes dangerous characters
 *    - validateMaxTools() ensures safe parameter values
 *
 * 4. Error Handling:
 *    - Specific error types for different failure modes
 *    - Better error messages with context
 *    - Proper error propagation
 *
 * 5. Security:
 *    - Redis URL validation
 *    - SSRF protection
 *    - Input sanitization
 *
 * TO APPLY THESE IMPROVEMENTS:
 * 1. Review this example file
 * 2. Apply similar patterns to redis-queue-client.ts
 * 3. Update other WALT files with the same patterns
 * 4. Run tests to ensure functionality preserved
 * 5. Update documentation with new error types
 */
