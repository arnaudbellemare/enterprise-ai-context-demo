/**
 * Redis Queue-Based WALT Client
 *
 * Production-grade architecture using Redis for decoupled, scalable tool discovery
 */

import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  ToolDiscoveryRequest,
  ToolDiscoveryResponse,
  ToolGenerationRequest,
  ToolGenerationResponse,
  DiscoveredWALTTool,
} from './types';
import { getNativeWALTDiscovery } from './native-discovery';

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

export class RedisWALTClient {
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

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.subscriber = new Redis(redisUrl);

      this.redis.on('connect', () => {
        this.connected = true;
        console.log('✅ Redis WALT Client connected');
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis connection error:', err.message);
        this.connected = false;
      });
    } catch (error: any) {
      console.warn(`⚠️ Redis not available: ${error.message}`);
      if (!this.useNativeFallback) {
        throw new Error('Redis required but not available');
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.connected && this.redis?.status === 'ready';
  }

  /**
   * Discover tools from a website (async pattern)
   */
  async discoverTools(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    // Fallback to native if Redis unavailable
    if (!this.isConnected()) {
      if (this.useNativeFallback) {
        console.log('⚠️ Redis unavailable, using native TypeScript backend');
        return await this.discoverToolsNative(request);
      }
      throw new Error('Redis not connected');
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
      console.log(`📤 Queued discovery job ${jobId} for ${request.url}`);

      // Wait for result
      const result = await this.waitForResult<ToolDiscoveryResponse>(jobId);

      if (result.success && result.data) {
        return result.data as ToolDiscoveryResponse;
      } else {
        throw new Error(result.error || 'Discovery failed');
      }
    } catch (error: any) {
      console.error(`❌ Redis queue error: ${error.message}`);

      // Fallback to native
      if (this.useNativeFallback) {
        console.log('⚠️ Falling back to native TypeScript backend');
        return await this.discoverToolsNative(request);
      }
      throw error;
    }
  }

  /**
   * Generate a specific tool from a website (async pattern)
   */
  async generateTool(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    if (!this.isConnected()) {
      if (this.useNativeFallback) {
        console.log('⚠️ Redis unavailable, using native TypeScript backend');
        return await this.generateToolNative(request);
      }
      throw new Error('Redis not connected');
    }

    const jobId = uuidv4();
    const job: QueueJob = {
      id: jobId,
      type: 'generate',
      request,
      timestamp: Date.now(),
    };

    try {
      await this.redis!.lpush(this.queueName, JSON.stringify(job));
      console.log(`📤 Queued generation job ${jobId} for ${request.url}`);

      const result = await this.waitForResult<ToolGenerationResponse>(jobId);

      if (result.success && result.data) {
        return result.data as ToolGenerationResponse;
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error(`❌ Redis queue error: ${error.message}`);

      if (this.useNativeFallback) {
        console.log('⚠️ Falling back to native TypeScript backend');
        return await this.generateToolNative(request);
      }
      throw error;
    }
  }

  /**
   * Discover tools asynchronously (fire-and-forget)
   */
  async discoverToolsAsync(request: ToolDiscoveryRequest): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Redis not connected - async mode requires Redis');
    }

    const jobId = uuidv4();
    const job: QueueJob = {
      id: jobId,
      type: 'discover',
      request,
      timestamp: Date.now(),
    };

    await this.redis!.lpush(this.queueName, JSON.stringify(job));
    console.log(`📤 Queued async discovery job ${jobId}`);

    return jobId;
  }

  /**
   * Get result of async job
   */
  async getJobResult<T = ToolDiscoveryResponse | ToolGenerationResponse>(
    jobId: string
  ): Promise<QueueResult | null> {
    if (!this.isConnected()) {
      return null;
    }

    const resultKey = `${this.resultPrefix}${jobId}`;
    const resultJson = await this.redis!.get(resultKey);

    if (!resultJson) {
      return null;
    }

    return JSON.parse(resultJson) as QueueResult;
  }

  /**
   * Wait for job result with timeout
   */
  private async waitForResult<T>(jobId: string): Promise<QueueResult> {
    const resultKey = `${this.resultPrefix}${jobId}`;
    const startTime = Date.now();

    // Subscribe to result channel
    const resultChannel = `${this.resultPrefix}channel:${jobId}`;

    return new Promise<QueueResult>(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.subscriber?.unsubscribe(resultChannel);
        reject(new Error(`Timeout waiting for result after ${this.timeout}ms`));
      }, this.timeout);

      // Listen for pub/sub notification
      this.subscriber?.subscribe(resultChannel, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      this.subscriber?.on('message', async (channel, message) => {
        if (channel === resultChannel) {
          clearTimeout(timeoutId);
          this.subscriber?.unsubscribe(resultChannel);

          const result = JSON.parse(message) as QueueResult;
          resolve(result);
        }
      });

      // Also poll Redis key as backup
      const pollInterval = setInterval(async () => {
        const resultJson = await this.redis!.get(resultKey);
        if (resultJson) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          this.subscriber?.unsubscribe(resultChannel);

          const result = JSON.parse(resultJson) as QueueResult;
          resolve(result);
        }
      }, 1000);
    });
  }

  /**
   * Fallback to native TypeScript discovery
   */
  private async discoverToolsNative(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    const result = await this.nativeDiscovery.discoverTools({
      url: request.url,
      goal: request.goal,
      maxTools: request.max_tools || 10,
      headless: request.headless !== false,
    });

    const domain = new URL(request.url).hostname.replace('www.', '').split('.')[0];
    return {
      success: true,
      url: request.url,
      domain,
      tools_discovered: result.tools.length,
      tools: result.tools as any, // SimplifiedWALTTool[] compatible with DiscoveredWALTTool[]
      output_dir: '',
    } as ToolDiscoveryResponse;
  }

  /**
   * Fallback to native TypeScript generation
   */
  private async generateToolNative(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    const result = await this.nativeDiscovery.discoverTools({
      url: request.url,
      goal: request.goal,
      maxTools: 1,
      headless: request.headless !== false,
    });

    if (result.tools.length === 0) {
      return {
        success: false,
        url: request.url,
        goal: request.goal,
        error: 'No tools found matching the goal',
      };
    }

    return {
      success: true,
      url: request.url,
      goal: request.goal,
      tool: result.tools[0] as any,
    } as ToolGenerationResponse;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queueLength: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    if (!this.isConnected()) {
      return { queueLength: 0, processing: 0, completed: 0, failed: 0 };
    }

    const queueLength = await this.redis!.llen(this.queueName);
    const processing = await this.redis!.get(`${this.queueName}:processing`) || '0';
    const completed = await this.redis!.get(`${this.queueName}:completed`) || '0';
    const failed = await this.redis!.get(`${this.queueName}:failed`) || '0';

    return {
      queueLength,
      processing: parseInt(processing),
      completed: parseInt(completed),
      failed: parseInt(failed),
    };
  }

  /**
   * Clear completed job results older than TTL
   */
  async cleanupOldResults(ttlSeconds: number = 3600): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const pattern = `${this.resultPrefix}*`;
    const keys = await this.redis!.keys(pattern);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await this.redis!.ttl(key);
      if (ttl === -1) {
        // No TTL set, set it
        await this.redis!.expire(key, ttlSeconds);
      } else if (ttl === -2) {
        // Key doesn't exist (race condition)
        continue;
      }
      cleaned++;
    }

    return cleaned;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.nativeDiscovery.cleanup();

    if (this.redis) {
      await this.redis.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }
}

// Singleton instance
let instance: RedisWALTClient | undefined;

export function getRedisWALTClient(options?: RedisQueueOptions): RedisWALTClient {
  if (!instance) {
    instance = new RedisWALTClient(options);
  }
  return instance;
}
