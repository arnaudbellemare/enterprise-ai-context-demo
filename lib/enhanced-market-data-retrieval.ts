/**
 * Enhanced Market Data Retrieval System
 * 
 * Optimizes Perplexity integration and adds multiple data sources
 * for professional-grade art and collectibles valuation
 */

import { createLogger } from './walt/logger';

const logger = createLogger('EnhancedMarketData', 'info');

interface MarketDataResult {
  source: string;
  data: any;
  confidence: number;
  timestamp: Date;
  cost: number;
}

interface AuctionRecord {
  lotNumber: string;
  title: string;
  artist: string;
  year: string;
  hammerPrice: number;
  estimate: { low: number; high: number };
  saleDate: string;
  auctionHouse: string;
  condition: string;
  provenance: string[];
}

interface MarketTrend {
  category: string;
  trend: 'rising' | 'falling' | 'stable';
  percentageChange: number;
  timeframe: string;
  confidence: number;
}

export class EnhancedMarketDataRetrieval {
  private cache: Map<string, MarketDataResult> = new Map();
  private rateLimiter: Map<string, number> = new Map();
  private costTracker: { total: number; perSource: Map<string, number> } = {
    total: 0,
    perSource: new Map()
  };

  constructor() {
    logger.info('Enhanced Market Data Retrieval initialized');
  }

  /**
   * Optimized Perplexity integration with caching and retry logic
   */
  async getPerplexityMarketData(query: string, category: string): Promise<MarketDataResult> {
    const cacheKey = `perplexity_${category}_${query}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp.getTime() < 300000) { // 5 minutes
        logger.info('Returning cached Perplexity data', { query, category });
        return cached;
      }
    }

    // Rate limiting
    if (this.isRateLimited('perplexity')) {
      throw new Error('Rate limit exceeded for Perplexity');
    }

    try {
      const startTime = Date.now();
      
      // Optimized Perplexity query with specific market focus
      const optimizedQuery = this.optimizeQueryForMarketData(query, category);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are a professional art and collectibles market analyst. 
              Provide specific market data including:
              - Recent auction results with hammer prices
              - Current market trends and valuations
              - Comparable sales data
              - Market confidence indicators
              Focus on factual, verifiable market data.`
            },
            {
              role: 'user',
              content: optimizedQuery
            }
          ],
          max_tokens: 2000,
          temperature: 0.1, // Low temperature for factual data
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const cost = this.calculatePerplexityCost(data.usage);
      
      const result: MarketDataResult = {
        source: 'perplexity',
        data: data.choices[0].message.content,
        confidence: this.calculateConfidence(data.choices[0].message.content),
        timestamp: new Date(),
        cost
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      this.updateCostTracking('perplexity', cost);
      this.updateRateLimit('perplexity');

      logger.info('Perplexity market data retrieved', {
        query,
        category,
        cost,
        confidence: result.confidence,
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Perplexity market data retrieval failed', {
        error: error instanceof Error ? error.message : String(error),
        query,
        category
      });
      throw error;
    }
  }

  /**
   * Auction house data integration
   */
  async getAuctionData(query: string, category: string): Promise<AuctionRecord[]> {
    const auctionHouses = [
      'christies',
      'sothebys', 
      'heritage',
      'bonhams',
      'phillips'
    ];

    const results: AuctionRecord[] = [];

    for (const house of auctionHouses) {
      try {
        const data = await this.queryAuctionHouse(house, query, category);
        results.push(...data);
      } catch (error) {
        logger.warn(`Auction house ${house} failed`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Sort by relevance and recency
    return results.sort((a, b) => {
      const dateA = new Date(a.saleDate);
      const dateB = new Date(b.saleDate);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Real-time market trend analysis
   */
  async getMarketTrends(category: string, timeframe: string = '6months'): Promise<MarketTrend[]> {
    const trends: MarketTrend[] = [];

    try {
      // Get trend data from multiple sources
      const perplexityTrends = await this.getPerplexityMarketData(
        `Market trends for ${category} in the last ${timeframe}`,
        category
      );

      // Parse trend data from response
      const trendData = this.parseTrendData(perplexityTrends.data);
      trends.push(...trendData);

      logger.info('Market trends retrieved', {
        category,
        timeframe,
        trendCount: trends.length
      });

    } catch (error) {
      logger.error('Market trends retrieval failed', {
        error: error instanceof Error ? error.message : String(error),
        category,
        timeframe
      });
    }

    return trends;
  }

  /**
   * Aggregated market data from all sources
   */
  async getAggregatedMarketData(query: string, category: string): Promise<{
    perplexity: MarketDataResult;
    auctions: AuctionRecord[];
    trends: MarketTrend[];
    confidence: number;
    totalCost: number;
  }> {
    const startTime = Date.now();

    try {
      // Run all data retrieval in parallel
      const [perplexityData, auctionData, trendData] = await Promise.all([
        this.getPerplexityMarketData(query, category),
        this.getAuctionData(query, category),
        this.getMarketTrends(category)
      ]);

      const totalCost = perplexityData.cost + this.calculateAuctionDataCost(auctionData);
      const confidence = this.calculateAggregatedConfidence(perplexityData, auctionData, trendData);

      logger.info('Aggregated market data retrieved', {
        query,
        category,
        totalCost,
        confidence,
        duration: Date.now() - startTime,
        sources: {
          perplexity: !!perplexityData,
          auctions: auctionData.length,
          trends: trendData.length
        }
      });

      return {
        perplexity: perplexityData,
        auctions: auctionData,
        trends: trendData,
        confidence,
        totalCost
      };

    } catch (error) {
      logger.error('Aggregated market data retrieval failed', {
        error: error instanceof Error ? error.message : String(error),
        query,
        category
      });
      throw error;
    }
  }

  // Helper methods
  private optimizeQueryForMarketData(query: string, category: string): string {
    return `Market analysis for ${query} in ${category} category. 
    Include: recent auction results, comparable sales, current market value, 
    market trends, and confidence indicators. Focus on factual market data.`;
  }

  private calculatePerplexityCost(usage: any): number {
    // Perplexity pricing: $0.20 per 1M input tokens, $0.20 per 1M output tokens
    const inputCost = (usage.prompt_tokens / 1000000) * 0.20;
    const outputCost = (usage.completion_tokens / 1000000) * 0.20;
    return inputCost + outputCost;
  }

  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content quality indicators
    const indicators = [
      content.includes('auction'),
      content.includes('sold for'),
      content.includes('hammer price'),
      content.includes('estimate'),
      content.includes('comparable'),
      content.includes('market value')
    ];
    
    return indicators.filter(Boolean).length / indicators.length;
  }

  private async queryAuctionHouse(house: string, query: string, category: string): Promise<AuctionRecord[]> {
    // Mock implementation - would integrate with real auction house APIs
    logger.info(`Querying ${house} for ${category}`, { query });
    
    // This would be replaced with actual API calls to auction houses
    return [];
  }

  private parseTrendData(data: string): MarketTrend[] {
    // Parse trend data from Perplexity response
    // This would be more sophisticated in production
    return [];
  }

  private calculateAuctionDataCost(auctions: AuctionRecord[]): number {
    // Calculate cost for auction data retrieval
    return auctions.length * 0.01; // $0.01 per auction record
  }

  private calculateAggregatedConfidence(
    perplexity: MarketDataResult,
    auctions: AuctionRecord[],
    trends: MarketTrend[]
  ): number {
    const weights = { perplexity: 0.4, auctions: 0.4, trends: 0.2 };
    const perplexityConf = perplexity.confidence;
    const auctionConf = auctions.length > 0 ? 0.8 : 0.2;
    const trendConf = trends.length > 0 ? 0.7 : 0.3;

    return (
      perplexityConf * weights.perplexity +
      auctionConf * weights.auctions +
      trendConf * weights.trends
    );
  }

  private isRateLimited(source: string): boolean {
    const lastCall = this.rateLimiter.get(source);
    if (!lastCall) return false;
    return Date.now() - lastCall < 1000; // 1 second rate limit
  }

  private updateRateLimit(source: string): void {
    this.rateLimiter.set(source, Date.now());
  }

  private updateCostTracking(source: string, cost: number): void {
    this.costTracker.total += cost;
    const current = this.costTracker.perSource.get(source) || 0;
    this.costTracker.perSource.set(source, current + cost);
  }

  // Public methods for monitoring
  getCostTracking() {
    return this.costTracker;
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('Market data cache cleared');
  }
}

// Export singleton instance
export const enhancedMarketDataRetrieval = new EnhancedMarketDataRetrieval();
