/**
 * Multimodal Financial Data Visualization
 * Based on AndroidLab's SoM (Set of Mark) mode for multimodal models
 */

export interface FinancialVisualization {
  type: 'chart' | 'table' | 'dashboard' | 'heatmap' | 'scatter' | 'timeline';
  data: any;
  annotations: FinancialAnnotation[];
  insights: string[];
  confidence: number;
}

export interface FinancialAnnotation {
  id: string;
  type: 'highlight' | 'marker' | 'bounding_box' | 'text' | 'arrow';
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content: string;
  significance: 'high' | 'medium' | 'low';
  color: string;
}

export interface MarketData {
  timestamp: string;
  price: number;
  volume: number;
  indicators: {
    sma_20: number;
    sma_50: number;
    rsi: number;
    macd: number;
    bollinger_upper: number;
    bollinger_lower: number;
  };
  sentiment: number;
  news_impact: number;
}

export class MultimodalFinancialProcessor {
  private visualizations: Map<string, FinancialVisualization> = new Map();

  /**
   * Process financial data and create multimodal visualizations
   */
  async processFinancialData(
    marketData: MarketData[],
    task: string,
    visualizationType?: string
  ): Promise<FinancialVisualization> {
    console.log('📊 Multimodal Financial Processing:', task);
    console.log('Data points:', marketData.length);

    // Analyze data patterns
    const patterns = this.analyzeDataPatterns(marketData);
    const anomalies = this.detectAnomalies(marketData);
    const trends = this.identifyTrends(marketData);

    // Generate annotations based on analysis
    const annotations = this.generateAnnotations(patterns, anomalies, trends);
    
    // Generate insights
    const insights = this.generateInsights(patterns, anomalies, trends, task);

    // Create visualization
    const visualization: FinancialVisualization = {
      type: this.determineVisualizationType(task, patterns),
      data: {
        marketData,
        patterns,
        anomalies,
        trends,
        metadata: {
          timeRange: {
            start: marketData[0]?.timestamp,
            end: marketData[marketData.length - 1]?.timestamp
          },
          dataPoints: marketData.length,
          confidence: this.calculateOverallConfidence(patterns, anomalies, trends)
        }
      },
      annotations,
      insights,
      confidence: this.calculateOverallConfidence(patterns, anomalies, trends)
    };

    this.visualizations.set(task, visualization);
    return visualization;
  }

  /**
   * Analyze data patterns for financial insights
   */
  private analyzeDataPatterns(marketData: MarketData[]): any {
    const patterns = {
      volatility: this.calculateVolatility(marketData),
      momentum: this.calculateMomentum(marketData),
      support_resistance: this.findSupportResistance(marketData),
      volume_patterns: this.analyzeVolumePatterns(marketData),
      correlation: this.calculateCorrelations(marketData)
    };

    return patterns;
  }

  /**
   * Detect anomalies in financial data
   */
  private detectAnomalies(marketData: MarketData[]): any[] {
    const anomalies: any[] = [];
    const prices = marketData.map(d => d.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / prices.length);

    marketData.forEach((data, index) => {
      // Price anomaly detection
      if (Math.abs(data.price - mean) > 2 * stdDev) {
        anomalies.push({
          type: 'price_anomaly',
          timestamp: data.timestamp,
          value: data.price,
          severity: Math.abs(data.price - mean) > 3 * stdDev ? 'high' : 'medium',
          description: `Unusual price movement: ${data.price.toFixed(2)} (expected range: ${(mean - 2*stdDev).toFixed(2)} - ${(mean + 2*stdDev).toFixed(2)})`
        });
      }

      // Volume anomaly detection
      const avgVolume = marketData.reduce((sum, d) => sum + d.volume, 0) / marketData.length;
      if (data.volume > avgVolume * 3) {
        anomalies.push({
          type: 'volume_anomaly',
          timestamp: data.timestamp,
          value: data.volume,
          severity: 'high',
          description: `Unusual volume spike: ${data.volume.toLocaleString()} (avg: ${avgVolume.toLocaleString()})`
        });
      }

      // RSI extreme levels
      if (data.indicators.rsi > 80) {
        anomalies.push({
          type: 'rsi_overbought',
          timestamp: data.timestamp,
          value: data.indicators.rsi,
          severity: 'medium',
          description: `RSI indicates overbought conditions: ${data.indicators.rsi.toFixed(1)}`
        });
      } else if (data.indicators.rsi < 20) {
        anomalies.push({
          type: 'rsi_oversold',
          timestamp: data.timestamp,
          value: data.indicators.rsi,
          severity: 'medium',
          description: `RSI indicates oversold conditions: ${data.indicators.rsi.toFixed(1)}`
        });
      }
    });

    return anomalies;
  }

  /**
   * Identify trends in the data
   */
  private identifyTrends(marketData: MarketData[]): any {
    const trends = {
      short_term: this.calculateShortTermTrend(marketData.slice(-20)),
      medium_term: this.calculateMediumTermTrend(marketData.slice(-50)),
      long_term: this.calculateLongTermTrend(marketData),
      sentiment_trend: this.calculateSentimentTrend(marketData),
      volume_trend: this.calculateVolumeTrend(marketData)
    };

    return trends;
  }

  /**
   * Generate visual annotations for multimodal display
   */
  private generateAnnotations(
    patterns: any,
    anomalies: any[],
    trends: any
  ): FinancialAnnotation[] {
    const annotations: FinancialAnnotation[] = [];

    // Add trend annotations
    if (trends.short_term.direction === 'up') {
      annotations.push({
        id: 'trend_up',
        type: 'arrow',
        position: { x: 50, y: 20 },
        content: 'Short-term uptrend detected',
        significance: 'high',
        color: '#10B981'
      });
    }

    // Add anomaly annotations
    anomalies.slice(0, 5).forEach((anomaly, index) => {
      annotations.push({
        id: `anomaly_${index}`,
        type: 'marker',
        position: { 
          x: 10 + (index * 15), 
          y: 80,
          width: 10,
          height: 10
        },
        content: anomaly.description,
        significance: anomaly.severity === 'high' ? 'high' : 'medium',
        color: anomaly.severity === 'high' ? '#EF4444' : '#F59E0B'
      });
    });

    // Add support/resistance annotations
    if (patterns.support_resistance.support) {
      annotations.push({
        id: 'support_level',
        type: 'highlight',
        position: { x: 30, y: 70, width: 40, height: 5 },
        content: `Support level: ${patterns.support_resistance.support.toFixed(2)}`,
        significance: 'high',
        color: '#3B82F6'
      });
    }

    return annotations;
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    patterns: any,
    anomalies: any[],
    trends: any,
    task: string
  ): string[] {
    const insights: string[] = [];

    // Volatility insights
    if (patterns.volatility > 0.3) {
      insights.push(`High volatility detected (${(patterns.volatility * 100).toFixed(1)}%) - consider risk management strategies`);
    }

    // Trend insights
    if (trends.short_term.direction === trends.medium_term.direction) {
      insights.push(`Strong ${trends.short_term.direction} trend across multiple timeframes - momentum likely to continue`);
    }

    // Anomaly insights
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      insights.push(`${highSeverityAnomalies.length} high-severity anomalies detected - investigate underlying causes`);
    }

    // Sentiment insights
    if (trends.sentiment_trend.direction === 'positive' && trends.sentiment_trend.strength > 0.7) {
      insights.push(`Strong positive sentiment trend - favorable conditions for bullish strategies`);
    }

    // Volume insights
    if (trends.volume_trend.increasing) {
      insights.push(`Increasing volume trend suggests growing market interest and potential price movement`);
    }

    return insights;
  }

  // Helper methods for calculations
  private calculateVolatility(marketData: MarketData[]): number {
    const returns = marketData.slice(1).map((d, i) => 
      (d.price - marketData[i].price) / marketData[i].price
    );
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    return Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / returns.length);
  }

  private calculateMomentum(marketData: MarketData[]): number {
    const recent = marketData.slice(-10);
    const older = marketData.slice(-20, -10);
    const recentAvg = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.price, 0) / older.length;
    return (recentAvg - olderAvg) / olderAvg;
  }

  private findSupportResistance(marketData: MarketData[]): any {
    const prices = marketData.map(d => d.price);
    const support = Math.min(...prices);
    const resistance = Math.max(...prices);
    return { support, resistance };
  }

  private analyzeVolumePatterns(marketData: MarketData[]): any {
    const volumes = marketData.map(d => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    return {
      average: avgVolume,
      trend: this.calculateTrend(volumes),
      spikes: volumes.filter(v => v > avgVolume * 2).length
    };
  }

  private calculateCorrelations(marketData: MarketData[]): any {
    const prices = marketData.map(d => d.price);
    const volumes = marketData.map(d => d.volume);
    const sentiments = marketData.map(d => d.sentiment);
    
    return {
      price_volume: this.correlation(prices, volumes),
      price_sentiment: this.correlation(prices, sentiments),
      volume_sentiment: this.correlation(volumes, sentiments)
    };
  }

  private correlation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    return (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  }

  private calculateShortTermTrend(data: MarketData[]): any {
    return this.calculateTrend(data.map(d => d.price));
  }

  private calculateMediumTermTrend(data: MarketData[]): any {
    return this.calculateTrend(data.map(d => d.price));
  }

  private calculateLongTermTrend(data: MarketData[]): any {
    return this.calculateTrend(data.map(d => d.price));
  }

  private calculateSentimentTrend(data: MarketData[]): any {
    return this.calculateTrend(data.map(d => d.sentiment));
  }

  private calculateVolumeTrend(data: MarketData[]): any {
    const volumes = data.map(d => d.volume);
    return {
      direction: volumes[volumes.length - 1] > volumes[0] ? 'increasing' : 'decreasing',
      strength: Math.abs(volumes[volumes.length - 1] - volumes[0]) / volumes[0],
      increasing: volumes[volumes.length - 1] > volumes[0]
    };
  }

  private calculateTrend(values: number[]): any {
    const start = values[0];
    const end = values[values.length - 1];
    const change = end - start;
    const changePercent = change / start;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'sideways',
      strength: Math.abs(changePercent),
      change: change,
      changePercent: changePercent
    };
  }

  private determineVisualizationType(task: string, patterns: any): FinancialVisualization['type'] {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('chart') || lowerTask.includes('price')) return 'chart';
    if (lowerTask.includes('table') || lowerTask.includes('data')) return 'table';
    if (lowerTask.includes('dashboard') || lowerTask.includes('overview')) return 'dashboard';
    if (lowerTask.includes('correlation') || lowerTask.includes('heatmap')) return 'heatmap';
    if (lowerTask.includes('scatter') || lowerTask.includes('relationship')) return 'scatter';
    if (lowerTask.includes('timeline') || lowerTask.includes('history')) return 'timeline';
    
    return 'chart'; // Default
  }

  private calculateOverallConfidence(patterns: any, anomalies: any[], trends: any): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence based on data quality
    if (anomalies.length < 3) confidence += 0.1;
    if (trends.short_term.direction === trends.medium_term.direction) confidence += 0.1;
    if (patterns.correlation.price_volume > 0.5) confidence += 0.05;
    if (patterns.volatility < 0.2) confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }
}
