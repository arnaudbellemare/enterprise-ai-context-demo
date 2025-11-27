/**
 * Batch Market Insights API Route
 * 
 * Generates market insights for all collectibles categories at once
 * Useful for weekly/daily updates across all categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketInsightsService, type CollectiblesCategory } from '@/lib/market-insights/market-insights-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const frequency = body.frequency || 'weekly';
    const categories = body.categories || ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
    
    // Validate categories
    const validCategories: CollectiblesCategory[] = ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
    const invalidCategories = categories.filter((cat: string) => !validCategories.includes(cat as CollectiblesCategory));
    
    if (invalidCategories.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid categories: ${invalidCategories.join(', ')}. Must be one of: ${validCategories.join(', ')}`
      }, { status: 400 });
    }

    console.log(`📊 Generating batch market insights for ${categories.length} categories (${frequency})`);

    // Generate insights for all categories in parallel
    const results = await Promise.allSettled(
      categories.map(async (category: CollectiblesCategory) => {
        try {
          const insights = await marketInsightsService.generateMarketInsights({
            category,
            frequency: frequency as 'daily' | 'weekly',
            includeItems: body.includeItems !== false,
            includeIndex: body.includeIndex !== false,
            includeOutlook: body.includeOutlook !== false,
            maxItems: body.maxItems || 3,
            maxIndexAssets: body.maxIndexAssets || 5,
          });

          return {
            category,
            success: true,
            insights,
            markdown: marketInsightsService.formatAsMarkdown(insights),
          };
        } catch (error) {
          return {
            category,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Process results
    const successful = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value);
    
    const failed = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value.success)
      .map(r => r.value);

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => ({ error: r.reason instanceof Error ? r.reason.message : 'Unknown error' }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      summary: {
        total: categories.length,
        successful: successful.length,
        failed: failed.length + errors.length,
        processingTime,
      },
      results: {
        successful,
        failed: [...failed, ...errors],
      },
      metadata: {
        frequency,
        generatedAt: new Date().toISOString(),
        categories,
      },
    });

  } catch (error) {
    console.error('❌ Batch market insights generation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Batch market insights generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/market-insights/batch - Documentation
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    service: 'Batch Market Insights API',
    version: '1.0.0',
    description: 'Generates market pulse reports for all collectibles categories using PERMUTATION_LITE',
    endpoint: 'POST /api/market-insights/batch',
    example: {
      request: {
        frequency: 'weekly',
        categories: ['watches', 'cars', 'jewelry', 'sports', 'nfts'],
        includeItems: true,
        includeIndex: true,
        includeOutlook: true,
      },
      response: {
        summary: {
          total: 5,
          successful: 5,
          failed: 0,
          processingTime: 15000,
        },
        results: {
          successful: [],
          failed: [],
        },
      },
    },
    categories: ['watches', 'cars', 'jewelry', 'sports', 'nfts'],
    frequencies: ['daily', 'weekly'],
  });
}







