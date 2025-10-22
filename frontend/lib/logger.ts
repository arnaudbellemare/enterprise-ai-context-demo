/**
 * Structured Logger for Production
 * 
 * Replaces 131 console statements with production-ready logging
 * Provides structured logging, log levels, and context tracking
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel;
  private isProduction: boolean;
  private context: LogContext = {};

  private constructor() {
    this.currentLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Set global context that will be included in all logs
   */
  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  public clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  public child(additionalContext: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.currentLevel = this.currentLevel;
    childLogger.isProduction = this.isProduction;
    childLogger.context = { ...this.context, ...additionalContext };
    return childLogger;
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, error, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, undefined, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, undefined, context);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, undefined, context);
  }

  /**
   * Log performance metrics
   */
  public performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      metadata
    });
  }

  /**
   * Log API calls
   */
  public apiCall(method: string, url: string, statusCode: number, duration: number): void {
    this.info(`API Call: ${method} ${url}`, {
      operation: 'api_call',
      metadata: {
        method,
        url,
        statusCode,
        duration
      }
    });
  }

  /**
   * Log cache operations
   */
  public cache(operation: 'hit' | 'miss' | 'set' | 'clear', key: string, metadata?: Record<string, any>): void {
    this.debug(`Cache ${operation}: ${key}`, {
      operation: 'cache',
      metadata: {
        cacheOperation: operation,
        key,
        ...metadata
      }
    });
  }

  /**
   * Log brain system operations
   */
  public brain(operation: string, query: string, skills: string[], duration: number, metadata?: Record<string, any>): void {
    this.info(`Brain: ${operation}`, {
      operation: 'brain',
      metadata: {
        brainOperation: operation,
        query: query.substring(0, 100), // Truncate for privacy
        skills,
        duration,
        ...metadata
      }
    });
  }

  /**
   * Log MoE operations
   */
  public moe(operation: string, experts: string[], scores: Record<string, number>, metadata?: Record<string, any>): void {
    this.info(`MoE: ${operation}`, {
      operation: 'moe',
      metadata: {
        moeOperation: operation,
        experts,
        scores,
        ...metadata
      }
    });
  }

  /**
   * Log security events
   */
  public security(event: string, details: Record<string, any>): void {
    this.warn(`Security: ${event}`, {
      operation: 'security',
      metadata: details
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    if (level > this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      } : undefined
    };

    // Format log entry
    const formatted = this.formatLogEntry(entry);
    
    // Output to console with appropriate method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
    }

    // In production, you might want to send to external logging service
    if (this.isProduction && level <= LogLevel.WARN) {
      this.sendToExternalLogger(entry);
    }
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const contextStr = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
    const errorStr = entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : '';
    
    return `[${timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}`;
  }

  /**
   * Send critical logs to external service (placeholder)
   */
  private sendToExternalLogger(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Examples: Sentry, DataDog, CloudWatch, etc.
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);

// Export specialized logging functions
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => 
  logger.performance(operation, duration, metadata);

export const logAPICall = (method: string, url: string, statusCode: number, duration: number) => 
  logger.apiCall(method, url, statusCode, duration);

export const logCache = (operation: 'hit' | 'miss' | 'set' | 'clear', key: string, metadata?: Record<string, any>) => 
  logger.cache(operation, key, metadata);

export const logBrain = (operation: string, query: string, skills: string[], duration: number, metadata?: Record<string, any>) => 
  logger.brain(operation, query, skills, duration, metadata);

export const logMoE = (operation: string, experts: string[], scores: Record<string, number>, metadata?: Record<string, any>) => 
  logger.moe(operation, experts, scores, metadata);

export const logSecurity = (event: string, details: Record<string, any>) => 
  logger.security(event, details);

/**
 * Initialize logger with production settings
 */
export const initializeLogger = () => {
  const level = process.env.LOG_LEVEL ? 
    LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] : 
    (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
  
  logger.setLevel(level);
  
  console.log(`📝 Logger: Initialized with level ${LogLevel[level]}`);
};