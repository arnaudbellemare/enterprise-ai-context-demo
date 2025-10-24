/**
 * Real Auction Data API Route
 * 
 * Integrates with the real auction dataset from:
 * https://github.com/jasonshi10/art_auction_valuation
 * 
 * Dataset: 37,638 art pieces sold for $9.47 billion
 * - 7 famous artists (Picasso, Van Gogh, etc.)
 * - 7,399 less known artists
 * - Price range: $3 to $119.92 million
 */

import { NextRequest, NextResponse } from 'next/server';
import { realAuctionDataIntegration } from '../../../../lib/real-auction-data-integration';

export async function POST(request: NextRequest) {
  try {
    const body: { 
      artist: string; 
      material?: string;
      priceRange?: { min: number; max: number };
      yearRange?: { start: number; end: number };
    } = await request.json();
    
    console.log('📊 Real Auction Data search starting...', {
      artist: body.artist,
      material: body.material,
      priceRange: body.priceRange,
      yearRange: body.yearRange
    });

    // Search real auction data
    const result = await realAuctionDataIntegration.searchAuctionData(
      body.artist,
      body.material,
      body.priceRange,
      body.yearRange
    );
    
    console.log('✅ Real Auction Data search completed', {
      artist: body.artist,
      totalRecords: result.totalRecords,
      totalValue: result.totalValue,
      averagePrice: result.averagePrice,
      confidence: result.confidence
    });

    return NextResponse.json({
      success: true,
      data: {
        artist: body.artist,
        searchCriteria: {
          material: body.material,
          priceRange: body.priceRange,
          yearRange: body.yearRange
        },
        results: result,
        datasetStats: realAuctionDataIntegration.getDatasetStats(),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Real Auction Data search failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Real Auction Data search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const artist = url.searchParams.get('artist');
    
    if (artist) {
      // Get market analysis for specific artist
      const analysis = await realAuctionDataIntegration.getArtistMarketAnalysis(artist);
      
      return NextResponse.json({
        success: true,
        data: {
          artist,
          analysis,
          datasetStats: realAuctionDataIntegration.getDatasetStats()
        }
      });
    } else {
      // Get dataset statistics
      const stats = realAuctionDataIntegration.getDatasetStats();
      const famousArtists = realAuctionDataIntegration.getFamousArtists();
      const lessKnownArtists = realAuctionDataIntegration.getLessKnownArtists();
      
      return NextResponse.json({
        success: true,
        data: {
          datasetStats: stats,
          famousArtists,
          lessKnownArtists,
          description: {
            source: 'GitHub: jasonshi10/art_auction_valuation',
            totalRecords: '37,638 art pieces',
            totalValue: '$9.47 billion',
            priceRange: '$3 to $119.92 million',
            classification: '7 famous artists vs 7,399 less known artists'
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Real Auction Data request failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Real Auction Data request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
