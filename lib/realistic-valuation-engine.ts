/**
 * Realistic Valuation Engine
 * 
 * Uses real market data to calculate accurate valuations
 * for art, jewelry, and collectibles
 */

import { createLogger } from './walt/logger';
import { realisticMarketDataCollector, MarketData, SaleRecord } from './realistic-market-data-collector';

const logger = createLogger('RealisticValuationEngine', 'info');

interface Artwork {
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  condition: string;
  provenance: string[];
}

interface ValuationResult {
  estimatedValue: {
    low: number;
    high: number;
    mostLikely: number;
  };
  confidence: number;
  methodology: string[];
  comparableSales: SaleRecord[];
  marketTrends: {
    trend: 'rising' | 'falling' | 'stable';
    percentageChange: number;
    timeframe: string;
  };
  recommendations: string[];
}

export class RealisticValuationEngine {
  private conditionMultipliers: Map<string, number> = new Map();
  private categoryMultipliers: Map<string, number> = new Map();

  constructor() {
    this.initializeMultipliers();
    logger.info('Realistic Valuation Engine initialized');
  }

  /**
   * Main valuation method
   */
  async valuateItem(artwork: Artwork, category: string = 'art'): Promise<ValuationResult> {
    try {
      logger.info('Starting realistic valuation', {
        title: artwork.title,
        artist: artwork.artist,
        category
      });

      // 1. Collect market data
      const marketData = await realisticMarketDataCollector.collectMarketData(
        `${artwork.artist} ${artwork.title}`,
        category
      );

      // 2. Find comparable sales
      const comparableSales = this.findComparableSales(artwork, marketData.sales);

      // 3. Calculate base value
      const baseValue = this.calculateBaseValue(comparableSales);

      // 4. Adjust for condition
      const conditionAdjusted = this.adjustForCondition(baseValue, artwork.condition);

      // 5. Adjust for market trends
      const trendAdjusted = this.adjustForMarketTrends(conditionAdjusted, marketData);

      // 6. Calculate final valuation range
      const finalValuation = this.calculateFinalValuation(trendAdjusted, comparableSales);

      // 7. Calculate confidence
      const confidence = this.calculateConfidence(comparableSales, marketData);

      // 8. Generate recommendations
      const recommendations = this.generateRecommendations(artwork, finalValuation, comparableSales);

      // 9. Analyze market trends
      const marketTrends = this.analyzeMarketTrends(comparableSales);

      const result: ValuationResult = {
        estimatedValue: finalValuation,
        confidence,
        methodology: this.getMethodology(),
        comparableSales,
        marketTrends,
        recommendations
      };

      logger.info('Realistic valuation completed', {
        title: artwork.title,
        estimatedValue: finalValuation.mostLikely,
        confidence,
        comparableSalesCount: comparableSales.length
      });

      return result;

    } catch (error) {
      logger.error('Realistic valuation failed', {
        error: error instanceof Error ? error.message : String(error),
        artwork: artwork.title
      });
      throw error;
    }
  }

  /**
   * Find comparable sales from market data
   */
  private findComparableSales(artwork: Artwork, sales: SaleRecord[]): SaleRecord[] {
    // Filter sales by relevance
    const relevantSales = sales.filter(sale => {
      const titleMatch = this.calculateTitleSimilarity(artwork.title, sale.title);
      const artistMatch = this.calculateArtistSimilarity(artwork.artist, sale.title);
      
      return titleMatch > 0.3 || artistMatch > 0.3;
    });

    // Sort by relevance and recency
    return relevantSales
      .sort((a, b) => {
        const relevanceA = this.calculateRelevanceScore(artwork, a);
        const relevanceB = this.calculateRelevanceScore(artwork, b);
        return relevanceB - relevanceA;
      })
      .slice(0, 10); // Top 10 most relevant
  }

  /**
   * Calculate base value from comparable sales
   */
  private calculateBaseValue(comparableSales: SaleRecord[]): number {
    if (comparableSales.length === 0) {
      return 0;
    }

    // Use median price for more stability
    const prices = comparableSales.map(sale => sale.price).sort((a, b) => a - b);
    const medianIndex = Math.floor(prices.length / 2);
    return prices[medianIndex];
  }

  /**
   * Adjust value based on condition
   */
  private adjustForCondition(baseValue: number, condition: string): number {
    const multiplier = this.conditionMultipliers.get(condition.toLowerCase()) || 0.8;
    return baseValue * multiplier;
  }

  /**
   * Adjust for market trends
   */
  private adjustForMarketTrends(baseValue: number, marketData: MarketData): number {
    // Simple trend analysis based on recent vs older sales
    const recentSales = marketData.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const daysAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90; // Last 3 months
    });

    const olderSales = marketData.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const daysAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > 90 && daysAgo <= 365; // 3-12 months ago
    });

    if (recentSales.length === 0 || olderSales.length === 0) {
      return baseValue;
    }

    const recentAvg = recentSales.reduce((sum, sale) => sum + sale.price, 0) / recentSales.length;
    const olderAvg = olderSales.reduce((sum, sale) => sum + sale.price, 0) / olderSales.length;
    
    const trendMultiplier = recentAvg / olderAvg;
    return baseValue * trendMultiplier;
  }

  /**
   * Calculate final valuation range
   */
  private calculateFinalValuation(baseValue: number, comparableSales: SaleRecord[]): {
    low: number;
    high: number;
    mostLikely: number;
  } {
    if (comparableSales.length === 0) {
      return { low: 0, high: 0, mostLikely: 0 };
    }

    const prices = comparableSales.map(sale => sale.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate range based on price distribution
    const variance = this.calculateVariance(prices, avgPrice);
    const standardDeviation = Math.sqrt(variance);
    
    const low = Math.max(0, baseValue - standardDeviation);
    const high = baseValue + standardDeviation;
    const mostLikely = baseValue;

    return { low: Math.round(low), high: Math.round(high), mostLikely: Math.round(mostLikely) };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(comparableSales: SaleRecord[], marketData: MarketData): number {
    let confidence = 0.5; // Base confidence

    // More comparable sales = higher confidence
    if (comparableSales.length >= 5) confidence += 0.2;
    else if (comparableSales.length >= 3) confidence += 0.1;

    // Recent sales = higher confidence
    const recentSales = comparableSales.filter(sale => {
      const saleDate = new Date(sale.date);
      const daysAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 180; // Last 6 months
    });

    if (recentSales.length >= comparableSales.length * 0.5) confidence += 0.1;

    // Multiple sources = higher confidence
    const uniqueSources = new Set(comparableSales.map(sale => sale.source));
    if (uniqueSources.size >= 2) confidence += 0.1;

    // Market data quality
    confidence += marketData.confidence * 0.2;

    return Math.min(0.95, confidence);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(artwork: Artwork, valuation: any, comparableSales: SaleRecord[]): string[] {
    const recommendations: string[] = [];

    if (comparableSales.length < 3) {
      recommendations.push('Limited comparable sales data - consider professional appraisal');
    }

    if (artwork.condition.toLowerCase().includes('damaged')) {
      recommendations.push('Condition issues may affect value - consider restoration');
    }

    if (valuation.mostLikely > 50000) {
      recommendations.push('High-value item - consider professional insurance appraisal');
    }

    if (artwork.provenance.length === 0) {
      recommendations.push('Gather provenance documentation to support valuation');
    }

    const recentSales = comparableSales.filter(sale => {
      const saleDate = new Date(sale.date);
      const daysAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90;
    });

    if (recentSales.length === 0) {
      recommendations.push('No recent sales data - market may be inactive');
    }

    return recommendations;
  }

  /**
   * Analyze market trends
   */
  private analyzeMarketTrends(comparableSales: SaleRecord[]): any {
    if (comparableSales.length < 2) {
      return {
        trend: 'stable',
        percentageChange: 0,
        timeframe: 'insufficient data'
      };
    }

    // Sort by date
    const sortedSales = comparableSales.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const oldestPrice = sortedSales[0].price;
    const newestPrice = sortedSales[sortedSales.length - 1].price;
    const percentageChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;

    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (percentageChange > 5) trend = 'rising';
    else if (percentageChange < -5) trend = 'falling';

    return {
      trend,
      percentageChange: Math.round(percentageChange * 100) / 100,
      timeframe: '6 months'
    };
  }

  // Helper methods
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = title1.toLowerCase().split(' ');
    const words2 = title2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateArtistSimilarity(artist: string, title: string): number {
    const artistWords = artist.toLowerCase().split(' ');
    const titleWords = title.toLowerCase().split(' ');
    const commonWords = artistWords.filter(word => titleWords.includes(word));
    return commonWords.length / Math.max(artistWords.length, titleWords.length);
  }

  private calculateRelevanceScore(artwork: Artwork, sale: SaleRecord): number {
    let score = 0;
    
    // Title similarity
    score += this.calculateTitleSimilarity(artwork.title, sale.title) * 0.4;
    
    // Artist similarity
    score += this.calculateArtistSimilarity(artwork.artist, sale.title) * 0.3;
    
    // Recency bonus
    const saleDate = new Date(sale.date);
    const daysAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 90) score += 0.2;
    else if (daysAgo <= 365) score += 0.1;
    
    // Source quality bonus
    if (sale.source === 'Heritage Auctions') score += 0.1;
    else if (sale.source === '1stDibs') score += 0.05;
    
    return score;
  }

  private calculateVariance(prices: number[], mean: number): number {
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
  }

  private getMethodology(): string[] {
    return [
      'Comparable market analysis using online sales data',
      'Condition impact assessment',
      'Market trend analysis',
      'Multi-source data aggregation',
      'Statistical confidence scoring'
    ];
  }

  private initializeMultipliers(): void {
    // Condition multipliers
    this.conditionMultipliers.set('excellent', 1.0);
    this.conditionMultipliers.set('very good', 0.9);
    this.conditionMultipliers.set('good', 0.8);
    this.conditionMultipliers.set('fair', 0.7);
    this.conditionMultipliers.set('poor', 0.5);
    this.conditionMultipliers.set('damaged', 0.3);

    // Category multipliers
    this.categoryMultipliers.set('fine-art', 1.0);
    this.categoryMultipliers.set('antiques', 0.9);
    this.categoryMultipliers.set('jewelry', 1.1);
    this.categoryMultipliers.set('collectibles', 0.8);
  }
}

// Export singleton instance
export const realisticValuationEngine = new RealisticValuationEngine();

