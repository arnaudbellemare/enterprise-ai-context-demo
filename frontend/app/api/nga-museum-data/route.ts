/**
 * National Gallery of Art Museum Data API Route
 * 
 * Integrates with the National Gallery of Art Open Data Program:
 * https://github.com/NationalGalleryOfArt/opendata
 * 
 * Dataset: 130,000+ artworks from the National Gallery of Art
 * - Artist information and biographical data
 * - Artwork details and provenance
 * - Wikidata identifiers for research
 * - Collection management data
 */

import { NextRequest, NextResponse } from 'next/server';
import { ngaMuseumDataIntegration } from '../../../../lib/nga-museum-data-integration';

export async function POST(request: NextRequest) {
  try {
    const body: { 
      artist?: string;
      period?: string;
      medium?: string;
      classification?: string;
    } = await request.json();
    
    console.log('🏛️ NGA Museum Data search starting...', {
      artist: body.artist,
      period: body.period,
      medium: body.medium,
      classification: body.classification
    });

    // Search NGA Museum data
    const result = await ngaMuseumDataIntegration.searchMuseumData(
      body.artist,
      body.period,
      body.medium,
      body.classification
    );
    
    console.log('✅ NGA Museum Data search completed', {
      totalRecords: result.totalRecords,
      artists: result.artists.length,
      periods: result.periods.length,
      mediums: result.mediums.length,
      confidence: result.confidence
    });

    return NextResponse.json({
      success: true,
      data: {
        searchCriteria: {
          artist: body.artist,
          period: body.period,
          medium: body.medium,
          classification: body.classification
        },
        results: result,
        museumStats: ngaMuseumDataIntegration.getMuseumStats(),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ NGA Museum Data search failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'NGA Museum Data search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const artist = url.searchParams.get('artist');
    
    if (artist) {
      // Get museum profile for specific artist
      const profile = await ngaMuseumDataIntegration.getArtistMuseumProfile(artist);
      
      return NextResponse.json({
        success: true,
        data: {
          artist,
          profile,
          museumStats: ngaMuseumDataIntegration.getMuseumStats()
        }
      });
    } else {
      // Get museum statistics and available data
      const stats = ngaMuseumDataIntegration.getMuseumStats();
      const famousArtists = ngaMuseumDataIntegration.getFamousArtists();
      const periods = ngaMuseumDataIntegration.getAvailablePeriods();
      const mediums = ngaMuseumDataIntegration.getAvailableMediums();
      
      return NextResponse.json({
        success: true,
        data: {
          museumStats: stats,
          famousArtists,
          availablePeriods: periods,
          availableMediums: mediums,
          description: {
            source: 'National Gallery of Art Open Data Program',
            totalRecords: '130,000+ artworks',
            license: 'CC0-1.0 (Public Domain)',
            url: 'https://github.com/NationalGalleryOfArt/opendata',
            features: [
              'Artist biographical data',
              'Artwork provenance and history',
              'Wikidata identifiers for research',
              'Collection management data',
              'Exhibition history',
              'Bibliography and references'
            ]
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ NGA Museum Data request failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'NGA Museum Data request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
