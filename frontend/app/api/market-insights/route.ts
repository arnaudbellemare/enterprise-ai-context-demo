/**
 * Market Insights API Route
 * 
 * Generates market pulse reports for collectibles categories using PERMUTATION_LITE
 * 
 * POST /api/market-insights
 * {
 *   "category": "watches" | "cars" | "jewelry" | "sports" | "nfts",
 *   "frequency": "daily" | "weekly",
 *   "includeItems": boolean,
 *   "includeIndex": boolean,
 *   "includeOutlook": boolean,
 *   "maxItems": number,
 *   "maxIndexAssets": number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketInsightsService, type MarketInsightsConfig } from '../../../lib/market-insights/market-insights-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate request
    const validCategories = ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
    const validFrequencies = ['daily', 'weekly'];
    
    if (!body.category || !validCategories.includes(body.category)) {
      return NextResponse.json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      }, { status: 400 });
    }
    
    if (!body.frequency || !validFrequencies.includes(body.frequency)) {
      return NextResponse.json({
        success: false,
        error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`
      }, { status: 400 });
    }

    const config: MarketInsightsConfig = {
      category: body.category,
      frequency: body.frequency,
      includeItems: body.includeItems !== false,
      includeIndex: body.includeIndex !== false,
      includeOutlook: body.includeOutlook !== false,
      maxItems: body.maxItems || 3,
      maxIndexAssets: body.maxIndexAssets || 5,
    };

    console.log(`📊 Generating market insights for ${config.category} (${config.frequency})`);

    // Generate market insights using PERMUTATION_LITE
    const insights = await marketInsightsService.generateMarketInsights(config);

    // Format as markdown
    const markdown = marketInsightsService.formatAsMarkdown(insights);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        insights,
        markdown,
        formatted: insights, // Alias for compatibility
      },
      metadata: {
        processingTime,
        category: config.category,
        frequency: config.frequency,
        generatedAt: insights.metadata.generatedAt,
      },
    });

  } catch (error) {
    console.error('❌ Market insights generation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Market insights generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/market-insights - Health check and documentation
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const frequency = url.searchParams.get('frequency') || 'weekly';

  if (!category) {
    return NextResponse.json({
      service: 'Market Insights API',
      version: '1.0.0',
      description: 'Generates market pulse reports for collectibles categories using PERMUTATION_LITE',
      endpoints: {
        POST: '/api/market-insights',
        GET: '/api/market-insights?category={category}&frequency={daily|weekly}',
      },
      categories: ['watches', 'cars', 'jewelry', 'sports', 'nfts'],
      frequencies: ['daily', 'weekly'],
      example: {
        request: {
          category: 'watches',
          frequency: 'weekly',
          includeItems: true,
          includeIndex: true,
          includeOutlook: true,
        },
        response: {
          title: 'Market Pulse: Luxury Watches Market Update',
          marketOverview: 'Market overview data',
          specificItems: [],
          indexAssets: [],
          futureOutlook: 'Future outlook data',
        },
      },
    });
  }

  // Quick generation for GET requests
  try {
    const validCategories = ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
    const validFrequencies = ['daily', 'weekly'];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      }, { status: 400 });
    }

    const freq = validFrequencies.includes(frequency) ? frequency : 'weekly';

    const config: MarketInsightsConfig = {
      category: category as any,
      frequency: freq as any,
    };

    const insights = await marketInsightsService.generateMarketInsights(config);
    const markdown = marketInsightsService.formatAsMarkdown(insights);

    return NextResponse.json({
      success: true,
      data: {
        insights,
        markdown,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}







