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
