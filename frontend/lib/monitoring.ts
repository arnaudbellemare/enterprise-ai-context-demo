/**
 * Production Monitoring & Logging
 * Structured logging with performance tracking and error reporting
 */

export interface LogContext {
  userId?: string;
  requestId?: string;
  workflow?: string;
  domain?: string;
  [key: string]: any;
}

export interface PerformanceMetrics {
  duration: number;
  cost: number;
  tokensUsed?: number;
  cacheHit?: boolean;
}

class Monitor {
  private context: LogContext = {};
  
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }
  
  clearContext() {
    this.context = {};
  }
  
  info(message: string, data?: any) {
    this._log('INFO', message, data);
  }
  
  warn(message: string, data?: any) {
    this._log('WARN', message, data);
  }
  
  error(message: string, error?: Error | any, data?: any) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    this._log('ERROR', message, { ...data, error: errorData });
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      this._sendToSentry(message, error, data);
    }
  }
  
  performance(operation: string, metrics: PerformanceMetrics, data?: any) {
    this._log('PERF', `${operation}`, {
      ...data,
      metrics: {
        duration_ms: metrics.duration,
        cost_usd: metrics.cost,
        tokens_used: metrics.tokensUsed,
        cache_hit: metrics.cacheHit
      }
    });
    
    // Track in analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', operation, {
        event_category: 'performance',
        value: Math.round(metrics.duration),
        custom_map: {
          dimension1: metrics.cost,
          dimension2: metrics.cacheHit ? 'true' : 'false'
        }
      });
    }
  }
  
  workflow(workflowName: string, phase: 'start' | 'complete' | 'error', data?: any) {
    this._log('WORKFLOW', `${workflowName} - ${phase}`, {
      ...data,
      workflow: workflowName,
      phase
    });
  }
  
  private _log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: this.context,
      ...data
    };
    
    // Console logging with colors (development)
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        INFO: '\x1b[36m',   // Cyan
        WARN: '\x1b[33m',   // Yellow
        ERROR: '\x1b[31m',  // Red
        PERF: '\x1b[35m',   // Magenta
        WORKFLOW: '\x1b[32m' // Green
      };
      
      const color = colors[level as keyof typeof colors] || '\x1b[0m';
      const reset = '\x1b[0m';
      
      logger.info(`${color}[${level}]${reset} ${message}`, data || '');
    }
    
    // Structured JSON logging (production)
    if (process.env.NODE_ENV === 'production') {
      logger.info(JSON.stringify(logEntry));
    }
    
    // Send to logging service
    if (process.env.LOG_SERVICE_URL) {
      this._sendToLogService(logEntry);
    }
  }
  
  private async _sendToSentry(message: string, error: any, data?: any) {
    // Sentry integration (optional)
    try {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            custom: {
              ...this.context,
              ...data
            }
          },
          tags: {
            component: this.context.workflow || 'unknown'
          }
        });
      }
    } catch (e) {
      logger.error('Failed to send to Sentry:', e);
    }
  }
  
  private async _sendToLogService(logEntry: any) {
    // Send to external logging service (optional)
    try {
      if (process.env.LOG_SERVICE_URL) {
        await fetch(process.env.LOG_SERVICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      }
    } catch (e) {
      // Silent fail - don't break app if logging fails
      logger.error('Failed to send to log service:', e);
    }
  }
  
  // API monitoring helpers
  trackApiCall(endpoint: string, method: string, duration: number, status: number) {
    this.performance(`API: ${method} ${endpoint}`, {
      duration,
      cost: 0, // APIs don't have direct cost
    }, {
      endpoint,
      method,
      status,
      success: status >= 200 && status < 300
    });
  }
  
  trackModelCall(
    model: string,
    operation: string,
    duration: number,
    cost: number,
    tokensUsed?: number,
    cacheHit?: boolean
  ) {
    this.performance(`Model: ${model} - ${operation}`, {
      duration,
      cost,
      tokensUsed,
      cacheHit
    }, {
      model,
      operation
    });
  }
}

// Singleton instance
export const monitor = new Monitor();

// Convenience exports
export const log = {
  info: (message: string, data?: any) => monitor.info(message, data),
  warn: (message: string, data?: any) => monitor.warn(message, data),
  error: (message: string, error?: Error | any, data?: any) => monitor.error(message, error, data),
  perf: (operation: string, metrics: PerformanceMetrics, data?: any) => monitor.performance(operation, metrics, data),
  workflow: (name: string, phase: 'start' | 'complete' | 'error', data?: any) => monitor.workflow(name, phase, data),
  api: (endpoint: string, method: string, duration: number, status: number) => monitor.trackApiCall(endpoint, method, duration, status),
  model: (model: string, operation: string, duration: number, cost: number, tokens?: number, cacheHit?: boolean) => 
    monitor.trackModelCall(model, operation, duration, cost, tokens, cacheHit)
};

export default monitor;

