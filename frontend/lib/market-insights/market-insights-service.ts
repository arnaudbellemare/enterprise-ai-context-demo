/**
 * Market Insights Service
 * 
 * Generates market pulse reports for collectibles categories using PERMUTATION_LITE
 * Supports: watches, cars, jewelry, sports collectibles, NFTs
 * 
 * Format: Market Pulse reports with sections on:
 * - Market overview and trends
 * - Specific items and valuations
 * - Index assets analysis
 * - Future outlook
 */

import { PermutationLiteGAMPPipeline, type PermutationLiteGAMPConfig } from '../permutation-lite/permutation-lite-gamp-pipeline';
import { callPerplexityWithRateLimiting, type LLMMessage } from '../brain-skills/llm-helpers';

export type CollectiblesCategory = 'watches' | 'cars' | 'jewelry' | 'sports' | 'nfts';

export interface MarketInsightsConfig {
  category: CollectiblesCategory;
  frequency: 'daily' | 'weekly';
  includeItems?: boolean;
  includeIndex?: boolean;
  includeOutlook?: boolean;
  maxItems?: number;
  maxIndexAssets?: number;
}

export interface MarketInsightsResult {
  title: string;
  marketOverview: string;
  specificItems?: MarketItem[];
  indexAssets?: IndexAsset[];
  futureOutlook?: string;
  metadata: {
    category: CollectiblesCategory;
    frequency: string;
    generatedAt: string;
    dataSources: string[];
    confidence: number;
  };
}

export interface MarketItem {
  name: string;
  description: string;
  marketCap?: number;
  priceRange?: { min: number; max: number };
  trend?: 'rising' | 'stable' | 'declining';
  significance?: string;
}

export interface IndexAsset {
  name: string;
  marketCap: number;
  description: string;
  significance: string;
}

export class MarketInsightsService {
  private pipeline: PermutationLiteGAMPPipeline;

  constructor() {
    // Configure PERMUTATION_LITE for market insights generation
    // Using fast mode for demos - disables expensive optimizations
    const config: Partial<PermutationLiteGAMPConfig> = {
      enableOptimization: false, // Disable PromptMII/GEPA for speed
      enableGAMP: false, // Not needed for market insights
      enableLearning: false, // Skip learning for demo speed
      enableVerification: false, // Skip verification for speed
      enableTeacherStudent: false, // Disable web search for speed (use student only)
      fastMode: true, // Enable fast mode - skips expensive steps
      difficultyThreshold: 0.5,
    };

    this.pipeline = new PermutationLiteGAMPPipeline(config);
  }

  /**
   * Generate market insights for a specific category
   * Direct LLM call - fast and simple, no pipeline overhead
   */
  async generateMarketInsights(config: MarketInsightsConfig): Promise<MarketInsightsResult> {
    const query = this.buildMarketInsightsQuery(config);
    
    console.log(`📊 Generating market insights for ${config.category} (${config.frequency})`);

    // Direct LLM call - much faster than pipeline
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a market analyst specializing in collectibles and art investments. Generate comprehensive Market Pulse reports with specific data, percentages, and dollar amounts.'
      },
      {
        role: 'user',
        content: query
      }
    ];

    // Direct LLM call - callPerplexityWithRateLimiting automatically falls back to Ollama if needed
    console.log('   ⏳ Making LLM call (this may take 30-90 seconds for Ollama)...');
    
    // Add hard timeout wrapper to prevent infinite hangs
    const llmCallPromise = callPerplexityWithRateLimiting(messages, {
      temperature: 0.7,
      maxTokens: 1500, // Reduced for faster Ollama response
      timeout: 120000 // 120 second timeout for Ollama (local models are slower)
    });
    
    const hardTimeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Hard timeout: LLM call exceeded 150 seconds - service may be unresponsive')), 150000)
    );
    
    const llmResult = await Promise.race([llmCallPromise, hardTimeoutPromise]);
    
    // Validate response before parsing
    if (!llmResult || !llmResult.content) {
      throw new Error('LLM call returned empty response');
    }
    
    if (llmResult.provider === 'error' || llmResult.content.startsWith('Error:')) {
      throw new Error(`LLM call failed: ${llmResult.content}`);
    }
    
    const response = llmResult.content;

    // Parse and structure the response
    const insights = this.parseMarketInsightsResponse(response, config);

    return insights;
  }

  /**
   * Build query for market insights generation
   * Optimized for art collectibles market with Market Pulse format
   */
  private buildMarketInsightsQuery(config: MarketInsightsConfig): string {
    const categoryNames: Record<CollectiblesCategory, string> = {
      watches: 'luxury watches and timepieces',
      cars: 'collectible and classic cars',
      jewelry: 'fine jewelry and gemstones',
      sports: 'sports memorabilia and collectibles',
      nfts: 'NFTs and digital art collectibles',
    };

    const categoryName = categoryNames[config.category];
    const timeFrame = config.frequency === 'daily' ? '24 hours' : 'past week';

    // Simplified prompt for faster Ollama processing
    let query = `Generate a Market Pulse report for ${categoryName} covering the ${timeFrame}.\n\n`;
    
    query += `Format:\n`;
    query += `Title: "Market Pulse: [Category] [Status]"\n\n`;
    query += `Market Overview (200-300 words): Include market trends, percentage changes, key numbers, and current status.\n\n`;

    if (config.includeItems !== false) {
      query += `Specific Items (${config.maxItems || 3} items): Name, description, market cap if available.\n\n`;
    }

    if (config.includeIndex !== false) {
      query += `Index Assets (${config.maxIndexAssets || 5} assets): Name and market positioning.\n\n`;
    }

    if (config.includeOutlook !== false) {
      query += `Future Outlook (150-200 words): Trends, technology, demographics, and market projections.\n\n`;
    }

    query += `Use specific numbers, percentages, and dollar amounts. Professional financial analysis tone.`;

    return query;
  }

  /**
   * Parse PERMUTATION_LITE response into structured market insights
   */
  private parseMarketInsightsResponse(
    response: string,
    config: MarketInsightsConfig
  ): MarketInsightsResult {
    // Clean up response - remove incomplete trailing content
    let cleanedResponse = response;
    // Remove incomplete markdown patterns at the end
    cleanedResponse = cleanedResponse.replace(/\*\*[0-9]+\s*$/, '').replace(/\*\*[A-Z][^*]*\*\*\s*$/, '');
    
    // Extract title from first line
    const lines = cleanedResponse.split('\n').filter(line => line.trim());
    const titleLine = lines.find(line => 
      line.startsWith('Market Pulse:') || 
      line.startsWith('# Market Pulse') ||
      line.match(/^#{1,2}\s+Market\s+Pulse/i)
    );
    const title = titleLine ? 
      titleLine.replace(/^#{1,3}\s+/, '').replace(/^Market\s+Pulse:\s*/i, 'Market Pulse:').trim() :
      `Market Pulse: ${config.category.charAt(0).toUpperCase() + config.category.slice(1)} Market Update`;

    // Extract market overview (first major section)
    const overviewStart = lines.findIndex(line => 
      line.toLowerCase().includes('market overview') || 
      line.toLowerCase().includes('the ') ||
      lines.indexOf(line) < 10
    );
    const overviewEnd = lines.findIndex((line, idx) => 
      idx > overviewStart && (
        line.toLowerCase().includes('specific items') ||
        line.toLowerCase().includes('index assets') ||
        line.toLowerCase().includes('future outlook') ||
        line.match(/^#{1,3}\s/)
      )
    );
    
    const marketOverview = lines
      .slice(overviewStart >= 0 ? overviewStart : 0, overviewEnd >= 0 ? overviewEnd : lines.length)
      .join('\n')
      .replace(/^#{1,3}\s.*$/gm, '')
      .trim();

    // Extract specific items
    const items: MarketItem[] = [];
    if (config.includeItems !== false) {
      const itemsSectionStart = lines.findIndex(line => 
        line.toLowerCase().includes('specific items') ||
        line.toLowerCase().includes('notable items')
      );
      
      if (itemsSectionStart >= 0) {
        const itemsSection = lines.slice(itemsSectionStart);
        const itemsText = itemsSection.join('\n');
        
        // Clean up markdown formatting artifacts
        const cleanedText = itemsText
          .replace(/\*\*SPECIFIC ITEMS SECTION:\*\*/gi, '')
          .replace(/\*\*[0-9]+\s+([^*]+)\*\*/g, '$1') // Remove **number. ** wrappers
          .replace(/^#{1,3}\s+SPECIFIC\s+ITEMS.*$/gmi, '')
          .replace(/^\*\*.*SECTION.*\*\*/gmi, '');
        
        // Try multiple patterns to extract items
        // Pattern 1: Numbered items like "1. Item Name" or "**1. Item Name**"
        const numberedPattern = /(?:^|\n)\s*\*?\*?\d+\.\s+([^*\n]{10,}?)(?:\*\*|$|\n)/g;
        // Pattern 2: Headers like "## Item Name" or "### Item Name"
        const headerPattern = /^#{2,3}\s+([A-Z][^*\n]{10,}?)$/gm;
        // Pattern 3: Bold items like "**Item Name**"
        const boldPattern = /\*\*([A-Z][^*\n]{10,}?)\*\*/g;
        
        const extractedItems: Array<{ name: string; startPos: number }> = [];
        
        // Extract numbered items
        let match;
        let iterations = 0;
        const MAX_ITERATIONS = 1000; // Prevent infinite loops
        while ((match = numberedPattern.exec(cleanedText)) !== null && extractedItems.length < (config.maxItems || 3) * 2 && iterations++ < MAX_ITERATIONS) {
          const name = match[1].trim().replace(/^\*\*|\*\*$/g, '');
          if (name.length > 10 && !name.toLowerCase().includes('section') && !name.toLowerCase().includes('items')) {
            extractedItems.push({ name, startPos: match.index });
          }
        }
        
        // Extract header items if we don't have enough
        if (extractedItems.length < (config.maxItems || 3)) {
          headerPattern.lastIndex = 0; // Reset
          iterations = 0;
          while ((match = headerPattern.exec(cleanedText)) !== null && extractedItems.length < (config.maxItems || 3) * 2 && iterations++ < MAX_ITERATIONS) {
            const name = match[1].trim();
            if (name.length > 10 && !name.toLowerCase().includes('section') && !name.toLowerCase().includes('items')) {
              extractedItems.push({ name, startPos: match.index });
            }
          }
        }
        
        // Sort by position and take first N items
        extractedItems.sort((a, b) => a.startPos - b.startPos);
        const selectedItems = extractedItems.slice(0, config.maxItems || 3);
        
        selectedItems.forEach((itemInfo, idx) => {
          const itemName = itemInfo.name;
          const itemStart = itemInfo.startPos;
          const nextItem = selectedItems[idx + 1];
          const itemEnd = nextItem ? nextItem.startPos : itemStart + 800;
          
          let description = cleanedText.slice(itemStart, itemEnd)
            .replace(new RegExp(`.*${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?`, 'i'), '')
            .replace(/^#{1,3}\s+/gm, '')
            .replace(/^\*\*/gm, '')
            .replace(/\*\*$/gm, '')
            .trim();
          
          // Limit description length
          if (description.length > 500) {
            description = description.slice(0, 500) + '...';
          }
          
          // Extract market cap if mentioned
          const marketCapMatch = description.match(/\$[\d,]+(?:\.\d+)?\s*(?:million|billion|k|K)?/i) ||
                                 cleanedText.slice(itemStart, itemEnd).match(/\$[\d,]+(?:\.\d+)?\s*(?:million|billion|k|K)?/i);
          const marketCap = marketCapMatch ? this.parseMarketCap(marketCapMatch[0]) : undefined;
          
          // Only add if we have a reasonable name and description
          if (itemName.length >= 10 && !itemName.match(/^[\d\s\*\-\.]+$/)) {
            items.push({
              name: itemName,
              description: description || 'No detailed description available',
              marketCap,
              trend: this.extractTrend(description),
            });
          }
        });
      }
    }

    // Extract index assets
    const indexAssets: IndexAsset[] = [];
    if (config.includeIndex !== false) {
      const indexSectionStart = lines.findIndex(line => 
        line.toLowerCase().includes('index assets') ||
        line.toLowerCase().includes('index composition')
      );
      
      if (indexSectionStart >= 0) {
        const indexSection = lines.slice(indexSectionStart);
        const indexText = indexSection.join('\n');
        
        // Clean up markdown formatting artifacts
        const cleanedText = indexText
          .replace(/\*\*INDEX ASSETS.*\*\*/gi, '')
          .replace(/^#{1,3}\s+INDEX.*$/gmi, '')
          .replace(/^\*\*.*SECTION.*\*\*/gmi, '');
        
        // Look for items with market cap mentions - these are likely index assets
        // Pattern: Item name followed by market cap mention
        const assetWithCapPattern = /(?:^#{2,3}\s+|^\d+\.\s+|\*\*)([A-Z][^*\n]{15,}?)(?:\*\*|$|\n).*?\$[\d,]+(?:\.\d+)?\s*(?:million|billion|k|K)?/gi;
        
        const extractedAssets: Array<{ name: string; marketCap: number; startPos: number }> = [];
        let match;
        let iterations = 0;
        const MAX_ITERATIONS = 1000; // Prevent infinite loops
        
        while ((match = assetWithCapPattern.exec(cleanedText)) !== null && extractedAssets.length < (config.maxIndexAssets || 5) * 2 && iterations++ < MAX_ITERATIONS) {
          const assetName = match[1].trim().replace(/^\*\*|\*\*$/g, '');
          const assetSection = cleanedText.slice(match.index, match.index + 600);
          
          // Extract market cap
          const marketCapMatch = assetSection.match(/\$[\d,]+(?:\.\d+)?\s*(?:million|billion|k|K)?/i);
          const marketCap = marketCapMatch ? this.parseMarketCap(marketCapMatch[0]) : undefined;
          
          if (marketCap && assetName.length > 15 && !assetName.toLowerCase().includes('section') && !assetName.toLowerCase().includes('assets')) {
            extractedAssets.push({ name: assetName, marketCap, startPos: match.index });
          }
        }
        
        // Sort by position and take first N assets
        extractedAssets.sort((a, b) => a.startPos - b.startPos);
        const selectedAssets = extractedAssets.slice(0, config.maxIndexAssets || 5);
        
        selectedAssets.forEach((assetInfo) => {
          const assetStart = assetInfo.startPos;
          const assetDesc = cleanedText.slice(assetStart, assetStart + 600)
            .replace(new RegExp(`.*${assetInfo.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?`, 'i'), '')
            .replace(/^#{1,3}\s+/gm, '')
            .replace(/^\*\*/gm, '')
            .replace(/\*\*$/gm, '')
            .trim();
          
          indexAssets.push({
            name: assetInfo.name,
            marketCap: assetInfo.marketCap,
            description: assetDesc.slice(0, 200) || 'Significant market asset',
            significance: assetDesc.slice(200, 400) || 'Notable market asset',
          });
        });
      }
    }

    // Extract future outlook
    let futureOutlook: string | undefined;
    if (config.includeOutlook !== false) {
      const outlookStart = lines.findIndex(line => 
        line.toLowerCase().includes('future outlook') ||
        line.toLowerCase().includes('outlook') ||
        line.toLowerCase().includes('future trajectory')
      );
      
      if (outlookStart >= 0) {
        futureOutlook = lines
          .slice(outlookStart)
          .join('\n')
          .replace(/^#{1,3}\s.*$/gm, '')
          .trim()
          .slice(0, 2000);
      }
    }

    return {
      title: title.replace(/^#{1,3}\s+/, ''),
      marketOverview,
      specificItems: items.length > 0 ? items : undefined,
      indexAssets: indexAssets.length > 0 ? indexAssets : undefined,
      futureOutlook,
      metadata: {
        category: config.category,
        frequency: config.frequency,
        generatedAt: new Date().toISOString(),
        dataSources: ['PERMUTATION_LITE', 'Teacher-Student System', 'Market Data APIs'],
        confidence: 0.85, // High confidence for PERMUTATION_LITE outputs
      },
    };
  }

  /**
   * Parse market cap from string like "$626,875" or "$1.2 million"
   */
  private parseMarketCap(text: string): number {
    const cleaned = text.replace(/[$,]/g, '');
    const number = parseFloat(cleaned);
    
    if (text.toLowerCase().includes('billion')) {
      return number * 1_000_000_000;
    } else if (text.toLowerCase().includes('million')) {
      return number * 1_000_000;
    } else if (text.toLowerCase().includes('k')) {
      return number * 1_000;
    }
    
    return number;
  }

  /**
   * Extract trend from description
   */
  private extractTrend(description: string): 'rising' | 'stable' | 'declining' {
    const lower = description.toLowerCase();
    if (lower.includes('rising') || lower.includes('gaining') || lower.includes('upward')) {
      return 'rising';
    } else if (lower.includes('declining') || lower.includes('falling') || lower.includes('downward')) {
      return 'declining';
    }
    return 'stable';
  }

  /**
   * Format market insights as markdown report
   * Matches the Market Pulse professional format
   */
  formatAsMarkdown(insights: MarketInsightsResult): string {
    let markdown = `${insights.title}\n\n`;
    
    // Market Overview section
    markdown += `${insights.marketOverview}\n\n`;
    
    // Specific Items section
    if (insights.specificItems && insights.specificItems.length > 0) {
      insights.specificItems.forEach((item, idx) => {
        markdown += `${item.name}\n`;
        if (item.marketCap) {
          markdown += `${item.name} leads the index with a $${item.marketCap.toLocaleString()} market cap\n`;
        }
        markdown += `${item.description}\n\n`;
      });
    }
    
    // Index Assets section
    if (insights.indexAssets && insights.indexAssets.length > 0) {
      markdown += `Index Assets: Icons and Emerging Opportunities\n`;
      markdown += `The index's composition reveals key market positions and investment opportunities.\n\n`;
      
      insights.indexAssets.forEach(asset => {
        markdown += `${asset.name}\n`;
        markdown += `${asset.name} leads with a $${asset.marketCap.toLocaleString()} market capitalization\n\n`;
        markdown += `${asset.description}\n\n`;
        if (asset.significance) {
          markdown += `${asset.significance}\n\n`;
        }
      });
    }
    
    // Future Outlook section
    if (insights.futureOutlook) {
      markdown += `Future Outlook: Transformation Through Technology and Demographics\n`;
      markdown += `${insights.futureOutlook}\n\n`;
    }
    
    // Footer
    markdown += `---\n\n`;
    markdown += `*Market Pulse Report Generated: ${new Date(insights.metadata.generatedAt).toLocaleString()}* | `;
    markdown += `*Category: ${insights.metadata.category.charAt(0).toUpperCase() + insights.metadata.category.slice(1)}* | `;
    markdown += `*Frequency: ${insights.metadata.frequency.charAt(0).toUpperCase() + insights.metadata.frequency.slice(1)} Update*\n`;
    markdown += `*Data Sources: ${insights.metadata.dataSources.join(', ')}*\n`;
    markdown += `*Confidence: ${(insights.metadata.confidence * 100).toFixed(0)}%*\n`;
    
    return markdown;
  }
}

export const marketInsightsService = new MarketInsightsService();

