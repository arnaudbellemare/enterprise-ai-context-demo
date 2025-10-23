/**
 * Structured Logger for WALT
 *
 * Provides centralized logging with levels, context, and production-ready formatting.
 * Replaces console.log statements for better observability.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  url?: string;
  domain?: string;
  jobId?: string;
  workerId?: string;
  duration?: number;
  error?: Error | unknown;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

class WALTLogger implements Logger {
  private level: LogLevel;
  private component: string;

  constructor(component: string, level: LogLevel = 'info') {
    this.component = component;
    this.level = this.getLogLevel(level);
  }

  private getLogLevel(level: LogLevel): LogLevel {
    // In production, use environment variable
    const envLevel = (typeof process !== 'undefined'
      ? process.env.WALT_LOG_LEVEL
      : undefined) as LogLevel | undefined;

    return envLevel || level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '🚨'
    }[level];

    const contextStr = context ? JSON.stringify({ ...context, component: this.component }) : '';
    return `[${timestamp}] ${emoji} ${level.toUpperCase()} [${this.component}] ${message} ${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));

      // In production, could send to error tracking service
      if (context?.error && typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
        // TODO: Integrate with error tracking (Sentry, Datadog, etc.)
      }
    }
  }
}

/**
 * Create a logger instance for a component
 */
export function createLogger(component: string, level?: LogLevel): Logger {
  return new WALTLogger(component, level);
}

/**
 * Singleton loggers for common components
 */
export const loggers = {
  client: createLogger('walt:client'),
  redisQueue: createLogger('walt:redis-queue'),
  nativeDiscovery: createLogger('walt:native-discovery'),
  storage: createLogger('walt:storage'),
  orchestrator: createLogger('walt:orchestrator'),
  adapter: createLogger('walt:adapter'),
  aceIntegration: createLogger('walt:ace-integration'),
  toolIntegration: createLogger('walt:tool-integration'),
  unifiedClient: createLogger('walt:unified-client'),
};
