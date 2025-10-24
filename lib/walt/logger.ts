/**
 * Simple logger utility for the WALT system
 */

export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export function createLogger(name: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): Logger {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[level];

  return {
    info: (message: string, meta?: any) => {
      if (currentLevel <= 1) {
        console.log(`[${name}] INFO: ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
      }
    },
    error: (message: string, meta?: any) => {
      if (currentLevel <= 3) {
        console.error(`[${name}] ERROR: ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
      }
    },
    warn: (message: string, meta?: any) => {
      if (currentLevel <= 2) {
        console.warn(`[${name}] WARN: ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
      }
    },
    debug: (message: string, meta?: any) => {
      if (currentLevel <= 0) {
        console.debug(`[${name}] DEBUG: ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
      }
    }
  };
}
