/**
 * Domain Configuration for WALT Tool Discovery
 *
 * Defines discovery strategies for different domains
 */

import { DomainDiscoveryConfig } from './types';

/**
 * Financial Domain Configuration
 */
export const financialDomainConfig: DomainDiscoveryConfig = {
  domain: 'financial',
  urls: [
    'https://finance.yahoo.com',
    'https://www.coinmarketcap.com',
    'https://www.investing.com',
    'https://www.marketwatch.com',
    'https://www.bloomberg.com/markets'
  ],
  goals: [
    'Search for stock prices',
    'Get cryptocurrency data',
    'Find financial news',
    'Calculate investment returns',
    'Track market indices'
  ],
  priority: 1, // High priority
  max_tools_per_site: 5,
  cache_ttl_ms: 86400000 // 24 hours
};

/**
 * E-commerce Domain Configuration
 */
export const ecommerceDomainConfig: DomainDiscoveryConfig = {
  domain: 'e-commerce',
  urls: [
    'https://www.amazon.com',
    'https://www.ebay.com',
    'https://www.etsy.com',
    'https://www.walmart.com',
    'https://www.bestbuy.com'
  ],
  goals: [
    'Search for products',
    'Compare prices',
    'Add to cart',
    'Track orders',
    'Read reviews'
  ],
  priority: 2,
  max_tools_per_site: 8,
  cache_ttl_ms: 86400000 // 24 hours
};

/**
 * Research Domain Configuration
 */
export const researchDomainConfig: DomainDiscoveryConfig = {
  domain: 'research',
  urls: [
    'https://arxiv.org',
    'https://scholar.google.com',
    'https://www.researchgate.net',
    'https://pubmed.ncbi.nlm.nih.gov',
    'https://www.jstor.org'
  ],
  goals: [
    'Search for academic papers',
    'Find citations',
    'Download research articles',
    'Track authors',
    'Get paper metadata'
  ],
  priority: 1, // High priority
  max_tools_per_site: 6,
  cache_ttl_ms: 604800000 // 7 days (research tools change less frequently)
};

/**
 * Travel Domain Configuration
 */
export const travelDomainConfig: DomainDiscoveryConfig = {
  domain: 'travel',
  urls: [
    'https://www.airbnb.com',
    'https://www.booking.com',
    'https://www.expedia.com',
    'https://www.kayak.com',
    'https://www.hotels.com'
  ],
  goals: [
    'Search for accommodations',
    'Find flights',
    'Book hotels',
    'Compare prices',
    'Read reviews'
  ],
  priority: 3,
  max_tools_per_site: 6,
  cache_ttl_ms: 172800000 // 2 days
};

/**
 * Social Media Domain Configuration
 */
export const socialDomainConfig: DomainDiscoveryConfig = {
  domain: 'social',
  urls: [
    'https://twitter.com',
    'https://www.linkedin.com',
    'https://www.reddit.com',
    'https://www.facebook.com',
    'https://www.instagram.com'
  ],
  goals: [
    'Post content',
    'Search posts',
    'Get user profiles',
    'Find trending topics',
    'Interact with content'
  ],
  priority: 4, // Lower priority (requires auth typically)
  max_tools_per_site: 4,
  cache_ttl_ms: 43200000 // 12 hours
};

/**
 * News & Media Domain Configuration
 */
export const newsDomainConfig: DomainDiscoveryConfig = {
  domain: 'news',
  urls: [
    'https://www.reuters.com',
    'https://www.bbc.com/news',
    'https://www.cnn.com',
    'https://www.npr.org',
    'https://www.theguardian.com'
  ],
  goals: [
    'Search news articles',
    'Get breaking news',
    'Find topic coverage',
    'Read headlines',
    'Track stories'
  ],
  priority: 2,
  max_tools_per_site: 5,
  cache_ttl_ms: 21600000 // 6 hours (news changes frequently)
};

/**
 * Data & Analytics Domain Configuration
 */
export const analyticsDomainConfig: DomainDiscoveryConfig = {
  domain: 'analytics',
  urls: [
    'https://www.kaggle.com',
    'https://data.gov',
    'https://www.worldbank.org/data',
    'https://ourworldindata.org',
    'https://www.statista.com'
  ],
  goals: [
    'Search datasets',
    'Download data',
    'Get statistics',
    'Find visualizations',
    'Access APIs'
  ],
  priority: 2,
  max_tools_per_site: 6,
  cache_ttl_ms: 604800000 // 7 days
};

/**
 * All Domain Configurations
 */
export const domainConfigs: DomainDiscoveryConfig[] = [
  financialDomainConfig,
  ecommerceDomainConfig,
  researchDomainConfig,
  travelDomainConfig,
  socialDomainConfig,
  newsDomainConfig,
  analyticsDomainConfig
];

/**
 * Get domain configuration by name
 */
export function getDomainConfig(domain: string): DomainDiscoveryConfig | undefined {
  return domainConfigs.find(config => config.domain === domain);
}

/**
 * Get all domain names
 */
export function getAllDomains(): string[] {
  return domainConfigs.map(config => config.domain);
}

/**
 * Get high priority domains
 */
export function getHighPriorityDomains(): DomainDiscoveryConfig[] {
  return domainConfigs.filter(config => config.priority <= 2).sort((a, b) => a.priority - b.priority);
}

/**
 * Get domains sorted by priority
 */
export function getDomainsByPriority(): DomainDiscoveryConfig[] {
  return [...domainConfigs].sort((a, b) => a.priority - b.priority);
}
