/**
 * Advanced Valuation Analysis API
 * 
 * Demonstrates how Permutation AI components truly enhance valuation beyond basic price ranges
 * by analyzing market position, cross-market appeal, cultural significance, future potential, and risk assessment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedValuationAnalysis } from '../../../../lib/advanced-valuation-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artwork, baseValuation } = body;

    if (!artwork || !baseValuation) {
      return NextResponse.json(
        { error: 'Missing required fields: artwork, baseValuation' },
        { status: 400 }
      );
    }

    console.log('🎯 Advanced Valuation Analysis starting...', { 
      artist: artwork.artist, 
      title: artwork.title 
    });

    // Perform advanced valuation analysis
    const enhancement = await advancedValuationAnalysis.analyzeValuationEnhancement(
      artwork,
      baseValuation
    );

    console.log('✅ Advanced Valuation Analysis completed', {
      success: true,
      baseValuation: enhancement.baseValuation,
      adjustedValuation: enhancement.adjustedValuation,
      totalPremium: Object.values(enhancement.premiumFactors).reduce((sum: number, premium: number) => sum + premium, 0)
    });

    return NextResponse.json({
      success: true,
      data: enhancement,
      metadata: {
        processingTime: Date.now(),
        timestamp: new Date().toISOString(),
        description: {
          purpose: 'Advanced valuation analysis using Permutation AI components',
          components: [
            'Market Position Analysis: Determines if artist is leader/follower',
            'Cross-Market Appeal: Analyzes appeal across multiple market segments',
            'Cultural Significance: Assesses cultural impact and historical importance',
            'Future Potential: Projects growth trajectory and risk factors',
            'Risk Assessment: Evaluates market stability and volatility risks'
          ],
          enhancement: 'This analysis shows how advanced AI components truly enhance valuation beyond basic price ranges by considering market position, cultural significance, future potential, and risk factors.'
        }
      }
    });

  } catch (error: any) {
    console.error('Advanced Valuation Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Advanced valuation analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    description: {
      purpose: 'Advanced Valuation Analysis API',
      functionality: 'Demonstrates how Permutation AI components truly enhance valuation beyond basic price ranges',
      components: [
        'Market Position Analysis: Analyzes if artist is market leader or follower',
        'Cross-Market Appeal: Evaluates appeal across multiple collector segments',
        'Cultural Significance: Assesses cultural impact and historical importance',
        'Future Potential: Projects growth trajectory and identifies risk factors',
        'Risk Assessment: Evaluates market stability and volatility protection'
      ],
      enhancement: 'Shows how advanced AI components add real value to valuation by considering market position, cultural significance, future potential, and risk factors - not just basic price ranges.',
      usage: 'POST with artwork and baseValuation to get enhanced valuation analysis'
    }
  });
}
