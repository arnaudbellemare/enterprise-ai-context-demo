/**
 * Dynamic Market Tracker for Precise Items
 * 
 * Tracks real-time market fluctuations for:
 * - Specific art pieces (Sotheby's, Christie's, etc.)
 * - Collection items
 * - Cars (Ferrari, Lamborghini, classic cars)
 * - Jewelry (diamonds, watches, luxury items)
 * - Insured items with changing market values
 */

import { createLogger } from './walt/logger';

const logger = createLogger('DynamicMarketTracker');

export interface PreciseItem {
  id: string;
  type: 'art' | 'car' | 'jewelry' | 'collectible' | 'luxury';
  title: string;
  artist?: string;
  brand?: string;
  model?: string;
  year: string;
  provenance: string[];
  condition: string;
  dimensions?: string;
  materials?: string[];
  auctionHouse?: string;
  lotNumber?: string;
  lastSalePrice?: number;
  lastSaleDate?: string;
  currentEstimate?: {
    low: number;
    high: number;
  };
  marketTrend: 'rising' | 'falling' | 'stable';
  priceVolatility: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

export interface MarketDataPoint {
  date: string;
  price: number;
  source: string;
  confidence: number;
  marketCondition: 'bull' | 'bear' | 'neutral';
  volatility: number;
}

export interface DynamicValuationResult {
  item: PreciseItem;
  currentValue: {
    low: number;
    high: number;
    mostLikely: number;
  };
  marketAnalysis: {
    trend: 'rising' | 'falling' | 'stable';
    volatility: 'low' | 'medium' | 'high';
    priceChange: number;
    timeFrame: string;
  };
  confidence: number;
  dataPoints: MarketDataPoint[];
  recommendations: string[];
  lastUpdated: string;
}

export class DynamicMarketTracker {
  private marketData: Map<string, MarketDataPoint[]> = new Map();
  private itemRegistry: Map<string, PreciseItem> = new Map();
  private priceAlerts: Map<string, number> = new Map();

  constructor() {
    logger.info('Dynamic Market Tracker initialized');
    this.startMarketMonitoring();
  }

  async trackPreciseItem(item: PreciseItem): Promise<DynamicValuationResult> {
    logger.info('Tracking precise item', { 
      id: item.id, 
      type: item.type, 
      title: item.title 
    });

    // Register the item
    this.itemRegistry.set(item.id, item);

    // Collect real-time market data
    const marketData = await this.collectRealTimeMarketData(item);
    
    // Analyze market trends
    const marketAnalysis = this.analyzeMarketTrends(marketData);
    
    // Calculate current value with volatility
    const currentValue = this.calculateCurrentValue(item, marketData, marketAnalysis);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(item, marketAnalysis);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(marketData, item);

    return {
      item,
      currentValue,
      marketAnalysis,
      confidence,
      dataPoints: marketData,
      recommendations,
      lastUpdated: new Date().toISOString()
    };
  }

  private async collectRealTimeMarketData(item: PreciseItem): Promise<MarketDataPoint[]> {
    const dataPoints: MarketDataPoint[] = [];
    
    // Collect data from multiple sources based on item type
    if (item.type === 'art') {
      dataPoints.push(...await this.collectArtMarketData(item));
    } else if (item.type === 'car') {
      dataPoints.push(...await this.collectCarMarketData(item));
    } else if (item.type === 'jewelry') {
      dataPoints.push(...await this.collectJewelryMarketData(item));
    } else if (item.type === 'collectible') {
      dataPoints.push(...await this.collectCollectibleMarketData(item));
    }

    // Store in cache
    this.marketData.set(item.id, dataPoints);
    
    return dataPoints;
  }

  private async collectArtMarketData(item: PreciseItem): Promise<MarketDataPoint[]> {
    const dataPoints: MarketDataPoint[] = [];
    
    // Simulate real-time art market data collection
    const currentDate = new Date();
    
    // Recent auction results
    dataPoints.push({
      date: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      price: item.lastSalePrice || 50000,
      source: 'Sotheby\'s Recent Sale',
      confidence: 0.95,
      marketCondition: 'bull',
      volatility: 0.15
    });
    
    // Current market estimates
    dataPoints.push({
      date: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      price: (item.lastSalePrice || 50000) * 1.05,
      source: 'Christie\'s Estimate',
      confidence: 0.90,
      marketCondition: 'bull',
      volatility: 0.12
    });
    
    // Gallery prices
    dataPoints.push({
      date: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      price: (item.lastSalePrice || 50000) * 1.08,
      source: 'Gallery Market',
      confidence: 0.85,
      marketCondition: 'bull',
      volatility: 0.10
    });

    return dataPoints;
  }

  private async collectCarMarketData(item: PreciseItem): Promise<MarketDataPoint[]> {
    const dataPoints: MarketDataPoint[] = [];
    
    // Simulate real-time car market data
    const currentDate = new Date();
    const basePrice = this.getCarBasePrice(item);
    
    dataPoints.push({
      date: new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      price: basePrice,
      source: 'Classic Car Auction',
      confidence: 0.92,
      marketCondition: 'bull',
      volatility: 0.20
    });
    
    dataPoints.push({
      date: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      price: basePrice * 1.03,
      source: 'Dealer Network',
      confidence: 0.88,
      marketCondition: 'bull',
      volatility: 0.18
    });

    return dataPoints;
  }

  private async collectJewelryMarketData(item: PreciseItem): Promise<MarketDataPoint[]> {
    const dataPoints: MarketDataPoint[] = [];
    
    // Simulate real-time jewelry market data
    const currentDate = new Date();
    const basePrice = this.getJewelryBasePrice(item);
    
    dataPoints.push({
      date: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      price: basePrice,
      source: 'Jewelry Auction',
      confidence: 0.90,
      marketCondition: 'bull',
      volatility: 0.25
    });
    
    dataPoints.push({
      date: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      price: basePrice * 1.02,
      source: 'Luxury Retail',
      confidence: 0.85,
      marketCondition: 'bull',
      volatility: 0.22
    });

    return dataPoints;
  }

  private async collectCollectibleMarketData(item: PreciseItem): Promise<MarketDataPoint[]> {
    const dataPoints: MarketDataPoint[] = [];
    
    // Simulate real-time collectible market data
    const currentDate = new Date();
    const basePrice = this.getCollectibleBasePrice(item);
    
    dataPoints.push({
      date: new Date(currentDate.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      price: basePrice,
      source: 'Collectible Auction',
      confidence: 0.88,
      marketCondition: 'bull',
      volatility: 0.30
    });

    return dataPoints;
  }

  private getCarBasePrice(item: PreciseItem): number {
    const brand = item.brand?.toLowerCase() || '';
    const model = item.model?.toLowerCase() || '';
    const year = parseInt(item.year);
    
    if (brand.includes('ferrari')) {
      if (model.includes('250')) return 15000000;
      if (model.includes('f40')) return 2000000;
      if (model.includes('f50')) return 3000000;
      return 500000;
    } else if (brand.includes('lamborghini')) {
      if (model.includes('miura')) return 2000000;
      if (model.includes('countach')) return 800000;
      return 300000;
    } else if (brand.includes('porsche')) {
      if (model.includes('911')) return 150000;
      if (model.includes('carrera')) return 200000;
      return 100000;
    }
    
    return 50000; // Default
  }

  private getJewelryBasePrice(item: PreciseItem): number {
    const materials = item.materials || [];
    const materialsStr = materials.join(' ').toLowerCase();
    
    if (materialsStr.includes('diamond') && materialsStr.includes('carat')) {
      return 100000; // High-end diamond jewelry
    } else if (materialsStr.includes('gold')) {
      return 50000; // Gold jewelry
    } else if (materialsStr.includes('platinum')) {
      return 75000; // Platinum jewelry
    }
    
    return 25000; // Default
  }

  private getCollectibleBasePrice(item: PreciseItem): number {
    const title = item.title.toLowerCase();
    
    if (title.includes('vintage') || title.includes('antique')) {
      return 10000;
    } else if (title.includes('rare') || title.includes('limited')) {
      return 5000;
    }
    
    return 1000; // Default
  }

  private analyzeMarketTrends(dataPoints: MarketDataPoint[]): {
    trend: 'rising' | 'falling' | 'stable';
    volatility: 'low' | 'medium' | 'high';
    priceChange: number;
    timeFrame: string;
  } {
    if (dataPoints.length < 2) {
      return {
        trend: 'stable',
        volatility: 'low',
        priceChange: 0,
        timeFrame: 'insufficient data'
      };
    }

    const prices = dataPoints.map(dp => dp.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate volatility
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / avgPrice;

    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (priceChange > 5) trend = 'rising';
    else if (priceChange < -5) trend = 'falling';

    let volatilityLevel: 'low' | 'medium' | 'high' = 'low';
    if (volatility > 0.2) volatilityLevel = 'high';
    else if (volatility > 0.1) volatilityLevel = 'medium';

    return {
      trend,
      volatility: volatilityLevel,
      priceChange,
      timeFrame: `${dataPoints.length} data points over ${this.getTimeFrame(dataPoints)}`
    };
  }

  private getTimeFrame(dataPoints: MarketDataPoint[]): string {
    if (dataPoints.length === 0) return '0 days';
    
    const firstDate = new Date(dataPoints[0].date);
    const lastDate = new Date(dataPoints[dataPoints.length - 1].date);
    const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 7) return `${daysDiff} days`;
    if (daysDiff < 30) return `${Math.ceil(daysDiff / 7)} weeks`;
    return `${Math.ceil(daysDiff / 30)} months`;
  }

  private calculateCurrentValue(
    item: PreciseItem, 
    dataPoints: MarketDataPoint[], 
    marketAnalysis: any
  ): { low: number; high: number; mostLikely: number } {
    if (dataPoints.length === 0) {
      return {
        low: item.lastSalePrice || 10000,
        high: (item.lastSalePrice || 10000) * 1.2,
        mostLikely: item.lastSalePrice || 10000
      };
    }

    const prices = dataPoints.map(dp => dp.price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Apply market trend adjustment
    let trendMultiplier = 1.0;
    if (marketAnalysis.trend === 'rising') trendMultiplier = 1.05;
    else if (marketAnalysis.trend === 'falling') trendMultiplier = 0.95;
    
    // Apply volatility adjustment
    let volatilityMultiplier = 1.0;
    if (marketAnalysis.volatility === 'high') volatilityMultiplier = 1.1;
    else if (marketAnalysis.volatility === 'low') volatilityMultiplier = 0.95;
    
    const adjustedPrice = avgPrice * trendMultiplier * volatilityMultiplier;
    
    return {
      low: Math.round(adjustedPrice * 0.85),
      high: Math.round(adjustedPrice * 1.15),
      mostLikely: Math.round(adjustedPrice)
    };
  }

  private generateRecommendations(item: PreciseItem, marketAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    if (marketAnalysis.trend === 'rising') {
      recommendations.push('Market is rising - consider holding for higher value');
    } else if (marketAnalysis.trend === 'falling') {
      recommendations.push('Market is falling - consider selling soon');
    }
    
    if (marketAnalysis.volatility === 'high') {
      recommendations.push('High volatility detected - monitor market closely');
    }
    
    if (item.type === 'art') {
      recommendations.push('Consider professional appraisal for insurance updates');
    } else if (item.type === 'car') {
      recommendations.push('Check recent auction results for similar models');
    } else if (item.type === 'jewelry') {
      recommendations.push('Verify current diamond/gemstone market prices');
    }
    
    recommendations.push('Update insurance coverage based on current market value');
    recommendations.push('Consider professional authentication for high-value items');
    
    return recommendations;
  }

  private calculateConfidence(dataPoints: MarketDataPoint[], item: PreciseItem): number {
    if (dataPoints.length === 0) return 0.5;
    
    const avgConfidence = dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / dataPoints.length;
    const dataQuality = Math.min(dataPoints.length / 5, 1.0); // More data = higher quality
    const recency = this.calculateRecency(dataPoints);
    
    return Math.min((avgConfidence + dataQuality + recency) / 3, 0.98);
  }

  private calculateRecency(dataPoints: MarketDataPoint[]): number {
    if (dataPoints.length === 0) return 0.5;
    
    const mostRecent = new Date(dataPoints[dataPoints.length - 1].date);
    const now = new Date();
    const daysAgo = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysAgo < 7) return 0.95;
    if (daysAgo < 30) return 0.85;
    if (daysAgo < 90) return 0.70;
    return 0.50;
  }

  private startMarketMonitoring(): void {
    // Start background monitoring for price changes
    setInterval(() => {
      this.monitorPriceChanges();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  private async monitorPriceChanges(): Promise<void> {
    logger.info('Monitoring price changes for registered items');
    
    for (const [itemId, item] of this.itemRegistry) {
      const currentData = await this.collectRealTimeMarketData(item);
      const previousData = this.marketData.get(itemId) || [];
      
      if (currentData.length > 0 && previousData.length > 0) {
        const priceChange = this.calculatePriceChange(previousData, currentData);
        
        if (Math.abs(priceChange) > 0.1) { // 10% change threshold
          logger.info('Significant price change detected', {
            itemId,
            priceChange: `${(priceChange * 100).toFixed(2)}%`,
            item: item.title
          });
          
          // Trigger price alert
          this.triggerPriceAlert(itemId, priceChange);
        }
      }
    }
  }

  private calculatePriceChange(previousData: MarketDataPoint[], currentData: MarketDataPoint[]): number {
    const prevAvg = previousData.reduce((sum, dp) => sum + dp.price, 0) / previousData.length;
    const currAvg = currentData.reduce((sum, dp) => sum + dp.price, 0) / currentData.length;
    
    return (currAvg - prevAvg) / prevAvg;
  }

  private triggerPriceAlert(itemId: string, priceChange: number): void {
    const item = this.itemRegistry.get(itemId);
    if (!item) return;
    
    logger.info('Price alert triggered', {
      itemId,
      title: item.title,
      priceChange: `${(priceChange * 100).toFixed(2)}%`,
      recommendation: priceChange > 0 ? 'Consider updating insurance' : 'Consider selling'
    });
  }

  // Public methods for external access
  getItemValue(itemId: string): number | null {
    const item = this.itemRegistry.get(itemId);
    if (!item) return null;
    
    const dataPoints = this.marketData.get(itemId) || [];
    if (dataPoints.length === 0) return null;
    
    const prices = dataPoints.map(dp => dp.price);
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  getMarketTrend(itemId: string): string | null {
    const dataPoints = this.marketData.get(itemId) || [];
    if (dataPoints.length < 2) return null;
    
    const analysis = this.analyzeMarketTrends(dataPoints);
    return analysis.trend;
  }

  setPriceAlert(itemId: string, threshold: number): void {
    this.priceAlerts.set(itemId, threshold);
  }
}

export const dynamicMarketTracker = new DynamicMarketTracker();
