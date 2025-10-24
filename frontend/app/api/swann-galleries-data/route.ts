/**
 * Swann Galleries Auction Data API Route
 * 
 * Integrates with Swann Galleries auction data:
 * https://www.swanngalleries.com/auction-catalog/fine-books_YOJAGF8609
 * 
 * Features:
 * - Historical auction catalogs
 * - Past sale results with hammer prices
 * - Lot descriptions and estimates
 * - Artist and artwork information
 * - Auction dates and locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { swannGalleriesIntegration } from '../../../../lib/swann-galleries-integration';

export async function POST(request: NextRequest) {
  try {
    const body: { 
      artist?: string;
      category?: string;
      priceRange?: { min: number; max: number };
      dateRange?: { start: string; end: string };
    } = await request.json();
    
    console.log('🏛️ Swann Galleries auction data search starting...', {
      artist: body.artist,
      category: body.category,
      priceRange: body.priceRange,
      dateRange: body.dateRange
    });

    // Search Swann Galleries auction data
    const result = await swannGalleriesIntegration.searchAuctionData(
      body.artist,
      body.category,
      body.priceRange,
      body.dateRange
    );
    
    console.log('✅ Swann Galleries auction data search completed', {
      totalRecords: result.totalRecords,
      totalValue: result.totalValue,
      averagePrice: result.averagePrice,
      confidence: result.confidence
    });

    return NextResponse.json({
      success: true,
      data: {
        searchCriteria: {
          artist: body.artist,
          category: body.category,
          priceRange: body.priceRange,
          dateRange: body.dateRange
        },
        results: result,
        auctionStats: swannGalleriesIntegration.getAuctionStats(),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Swann Galleries auction data search failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Swann Galleries auction data search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const artist = url.searchParams.get('artist');
    
    if (artist) {
      // Get auction history for specific artist
      const history = await swannGalleriesIntegration.getArtistAuctionHistory(artist);
      
      return NextResponse.json({
        success: true,
        data: {
          artist,
          history,
          auctionStats: swannGalleriesIntegration.getAuctionStats()
        }
      });
    } else {
      // Get auction statistics and available data
      const stats = swannGalleriesIntegration.getAuctionStats();
      const categories = swannGalleriesIntegration.getAvailableCategories();
      const artists = swannGalleriesIntegration.getAvailableArtists();
      
      return NextResponse.json({
        success: true,
        data: {
          auctionStats: stats,
          availableCategories: categories,
          availableArtists: artists,
          description: {
            source: 'Swann Galleries',
            url: 'https://www.swanngalleries.com',
            features: [
              'Historical auction catalogs',
              'Past sale results with hammer prices',
              'Lot descriptions and estimates',
              'Artist and artwork information',
              'Auction dates and locations',
              'Success rates and realized prices',
              'Category-specific pricing data'
            ]
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Swann Galleries auction data request failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Swann Galleries auction data request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
