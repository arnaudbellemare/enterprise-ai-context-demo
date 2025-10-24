/**
 * Real Market Data API Route
 * 
 * Integrates with real art market data sources:
 * - Artsy (gallery prices, artist data)
 * - Artnet (auction results, price database)
 * - Sotheby's, Christie's, Heritage, Bonhams, Phillips
 */

import { NextRequest, NextResponse } from 'next/server';
import { realMarketDataIntegration } from '../../../../lib/real-market-data-integration';

export async function POST(request: NextRequest) {
  try {
    const body: { 
      artist: string; 
      medium: string[]; 
      year: string; 
      itemType?: string;
      sources?: string[];
    } = await request.json();
    
    console.log('🌐 Real Market Data Collection starting...', {
      artist: body.artist,
      medium: body.medium,
      year: body.year,
      itemType: body.itemType || 'art'
    });

    // Collect real market data from multiple sources
    const results = await realMarketDataIntegration.collectRealMarketData(
      body.artist,
      body.medium,
      body.year,
      body.itemType || 'art'
    );
    
    console.log('✅ Real Market Data Collection completed', {
      sources: results.length,
      totalDataPoints: results.reduce((sum, result) => sum + result.data.length, 0)
    });

    // Analyze the collected data
    const analysis = analyzeMarketData(results);
    
    return NextResponse.json({
      success: true,
      data: {
        artist: body.artist,
        medium: body.medium,
        year: body.year,
        itemType: body.itemType || 'art',
        sources: results,
        analysis,
        totalDataPoints: results.reduce((sum, result) => sum + result.data.length, 0),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Real Market Data Collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Real Market Data Collection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function analyzeMarketData(results: any[]): any {
  const allData = results.flatMap(result => result.data);
  
  if (allData.length === 0) {
    return {
      trend: 'insufficient_data',
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0,
      recommendations: ['No market data available']
    };
  }

  // Extract prices from all sources
  const prices = allData
    .map(item => item.hammerPrice || item.price || item.estimate?.high || 0)
    .filter(price => price > 0);

  if (prices.length === 0) {
    return {
      trend: 'insufficient_data',
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0,
      recommendations: ['No price data available']
    };
  }

  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Calculate trend
  const sortedPrices = prices.sort((a, b) => a - b);
  const firstQuartile = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
  const thirdQuartile = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
  const trend = thirdQuartile > firstQuartile * 1.1 ? 'rising' : 'stable';
  
  // Calculate confidence based on data quality
  const confidence = Math.min(
    (results.length * 0.2) + 
    (prices.length * 0.1) + 
    (averagePrice > 0 ? 0.3 : 0),
    0.95
  );

  // Generate recommendations
  const recommendations = [];
  if (trend === 'rising') {
    recommendations.push('Market is showing upward trend - consider holding');
  }
  if (prices.length >= 5) {
    recommendations.push('Strong data foundation from multiple sources');
  }
  if (confidence > 0.8) {
    recommendations.push('High confidence in market data accuracy');
  }
  recommendations.push('Consider professional appraisal for insurance updates');

  return {
    trend,
    averagePrice: Math.round(averagePrice),
    priceRange: { 
      min: Math.round(minPrice), 
      max: Math.round(maxPrice) 
    },
    confidence: Math.round(confidence * 100),
    dataQuality: {
      sources: results.length,
      dataPoints: prices.length,
      priceVariability: Math.round(((maxPrice - minPrice) / averagePrice) * 100)
    },
    recommendations
  };
}
