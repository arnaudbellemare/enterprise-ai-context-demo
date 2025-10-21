/**
 * Structured Logging System for PERMUTATION
 *
 * Replaces console.log with production-safe, structured logging.
 * Integrates with monitoring services and provides consistent log formatting.
 *
 * Usage:
 * ```typescript
 * import { logger } from './lib/logger';
 *
 * logger.info('User query processed', { query, domain, latency });
 * logger.error('API call failed', error, { endpoint, attempt });
 * logger.debug('Cache hit', { key, ttl });
 * ```
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: Error;
  context?: {
    file?: string;
    function?: string;
    line?: number;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const message = entry.message;

    let formatted = `[${timestamp}] [${levelName}] ${message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += ` ${JSON.stringify(entry.metadata)}`;
    }

    return formatted;
  }

  private log(level: LogLevel, message: string, metadataOrError?: Record<string, any> | Error, extraMetadata?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    // Handle error parameter
    if (metadataOrError instanceof Error) {
      entry.error = metadataOrError;
      entry.metadata = extraMetadata;
    } else {
      entry.metadata = metadataOrError;
    }

    const formatted = this.formatEntry(entry);

    // Console output in development
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted, entry.metadata);
          break;
        case LogLevel.INFO:
          console.info(formatted, entry.metadata);
          break;
        case LogLevel.WARN:
          console.warn(formatted, entry.metadata);
          break;
        case LogLevel.ERROR:
          console.error(formatted, entry.error || entry.metadata);
          break;
      }
    }

    // Production logging - send to monitoring service
    if (!this.isDevelopment && level >= LogLevel.WARN) {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Integration point for monitoring services:
    // - Datadog: datadog.logger.log()
    // - Sentry: Sentry.captureMessage() / Sentry.captureException()
    // - LogRocket: LogRocket.log()
    // - Custom: POST to /api/logs

    // Example Sentry integration (uncomment when configured):
    // if (entry.level === LogLevel.ERROR && entry.error) {
    //   Sentry.captureException(entry.error, {
    //     extra: entry.metadata,
    //     tags: { timestamp: entry.timestamp }
    //   });
    // }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log informational messages
   */
  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log error messages with optional Error object
   */
  error(message: string, error?: Error | Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, error, metadata);
  }

  /**
   * Performance measurement utility
   */
  performance(label: string, durationMs: number, metadata?: Record<string, any>) {
    this.info(`⚡ ${label}`, {
      durationMs,
      performance: true,
      ...metadata
    });
  }

  /**
   * Trace expensive operations
   */
  async trace<T>(label: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.performance(label, duration, { ...metadata, success: true });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, error as Error, { ...metadata, durationMs: duration });
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const log = logger;
export default logger;
