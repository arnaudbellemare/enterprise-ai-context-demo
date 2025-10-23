/**
 * WALT Integration - Main Export
 *
 * Centralized export for all WALT integration components
 */

// Client (supports Python, TypeScript, and Redis Queue backends)
export { getWALTClient, initializeWALTClient, WALTClient } from './client';
export { getUnifiedWALTClient, UnifiedWALTClient } from './unified-client';
export { getNativeWALTDiscovery, NativeWALTDiscovery } from './native-discovery';
export { getRedisWALTClient, RedisWALTClient } from './redis-queue-client';

// Types
export * from './types';

// Adapter
export {
  convertWALTToolToPERMUTATION,
  batchConvertWALTTools,
  validateWALTTool,
  calculateToolQualityScore
} from './adapter';

// Domain Configurations
export {
  financialDomainConfig,
  ecommerceDomainConfig,
  researchDomainConfig,
  travelDomainConfig,
  socialDomainConfig,
  newsDomainConfig,
  analyticsDomainConfig,
  domainConfigs,
  getDomainConfig,
  getAllDomains,
  getHighPriorityDomains,
  getDomainsByPriority
} from './domain-configs';

// Discovery Orchestrator
export { getDiscoveryOrchestrator, DiscoveryOrchestrator } from './discovery-orchestrator';

// Storage
export { getWALTStorage, WALTToolStorage } from './storage';

// Tool Integration
export {
  getWALTToolIntegration,
  initializeWALTTools,
  WALTToolIntegration
} from './tool-integration';

// ACE Integration
export { getWALTACEIntegration, WALTACEIntegration } from './ace-integration';

// Infrastructure (Production-Ready)
export { createLogger, loggers } from './logger';
export type { Logger, LogLevel, LogContext } from './logger';

export {
  WALTError,
  WALTDiscoveryError,
  WALTStorageError,
  WALTRedisError,
  WALTTimeoutError,
  WALTValidationError,
  isWALTError,
  getErrorMessage,
  getErrorDetails
} from './errors';

export {
  validateDiscoveryUrl,
  sanitizeGoal,
  validateMaxTools,
  validateToolName,
  validateRedisUrl,
  validateEnvironment
} from './validation';
export type { EnvironmentValidation } from './validation';

export { CacheManager, DiscoveryCacheManager, discoveryCache } from './cache-manager';
export type { CacheEntry, CacheOptions, CacheStats, DiscoveryCacheEntry } from './cache-manager';

export {
  calculateLLMCost,
  calculateBrowserCost,
  estimateToolExecutionCost,
  calculateDiscoveryCost,
  formatCost,
  calculateCostSummary
} from './cost-calculator';
export type { CostBreakdown, CostSummary } from './cost-calculator';
